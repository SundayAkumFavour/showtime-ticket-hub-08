import { useState, useEffect, useRef } from 'react';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '@/integrations/supabase/client';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  QrCode, 
  Check, 
  X, 
  Loader2, 
  Ticket, 
  Calendar, 
  Clock, 
  MapPin,
  Scan,
  AlertTriangle,
  Camera,
  CameraOff,
  Keyboard
} from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { Html5Qrcode } from 'html5-qrcode';

interface ScanResult {
  success: boolean;
  error?: string;
  order?: {
    id: string;
    reference: string;
    quantity: number;
    total_amount: number;
    checked_in: boolean;
    checked_in_at?: string;
    show: {
      id: string;
      title: string;
      venue: string;
      location: string;
      date: string;
      time: string;
    };
    ticket_tier: {
      id: string;
      name: string;
      price: number;
    };
    seat_info?: string;
  };
  message?: string;
}

const TicketScanner = () => {
  const [manualReference, setManualReference] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [cameraMode, setCameraMode] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const scannerContainerRef = useRef<string>('qr-reader');

  // Initialize/cleanup camera scanner
  useEffect(() => {
    if (cameraMode) {
      startCameraScanner();
    } else {
      stopCameraScanner();
    }

    return () => {
      stopCameraScanner();
    };
  }, [cameraMode]);

  // Focus on input for barcode scanner support
  useEffect(() => {
    if (!cameraMode && !scanResult) {
      inputRef.current?.focus();
    }
  }, [scanResult, cameraMode]);

  const startCameraScanner = async () => {
    try {
      if (scannerRef.current) {
        await stopCameraScanner();
      }

      const html5QrCode = new Html5Qrcode(scannerContainerRef.current);
      scannerRef.current = html5QrCode;

      await html5QrCode.start(
        { facingMode: 'environment' },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 },
          aspectRatio: 1,
        },
        async (decodedText) => {
          // Pause scanning while processing
          await html5QrCode.pause();
          await handleQRCodeScanned(decodedText);
          // Resume after processing
          setTimeout(() => {
            if (scannerRef.current?.getState() === 3) { // PAUSED state
              html5QrCode.resume();
            }
          }, 2000);
        },
        () => {} // Ignore errors during scanning
      );

      setCameraReady(true);
      toast.success('Camera ready - point at QR code');
    } catch (error: any) {
      console.error('Failed to start camera:', error);
      toast.error('Failed to access camera. Check permissions.');
      setCameraMode(false);
      setCameraReady(false);
    }
  };

  const stopCameraScanner = async () => {
    if (scannerRef.current) {
      try {
        const state = scannerRef.current.getState();
        if (state === 2 || state === 3) { // SCANNING or PAUSED
          await scannerRef.current.stop();
        }
        scannerRef.current.clear();
      } catch (error) {
        console.error('Error stopping scanner:', error);
      }
      scannerRef.current = null;
    }
    setCameraReady(false);
  };

  const handleQRCodeScanned = async (decodedText: string) => {
    try {
      const qrData = JSON.parse(decodedText);
      if (qrData.orderId && qrData.reference) {
        await verifyTicket(qrData.orderId, qrData.reference);
        return;
      }
    } catch {
      // Not JSON, try as plain reference
    }

    // Search by reference number
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, reference')
      .eq('reference', decodedText.trim().toUpperCase())
      .single();

    if (error || !order) {
      setScanResult({
        success: false,
        error: 'Ticket not found with this QR code',
      });
      toast.error('Ticket not found');
      return;
    }

    await verifyTicket(order.id, order.reference);
  };

  const verifyTicket = async (orderId: string, reference: string, markAsCheckedIn = false) => {
    setIsScanning(true);
    setScanResult(null);

    try {
      const response = await supabase.functions.invoke('check-in-ticket', {
        body: { orderId, reference, markAsCheckedIn },
      });

      if (response.error) {
        setScanResult({
          success: false,
          error: response.error.message || 'Failed to verify ticket',
        });
        toast.error('Verification failed');
        return;
      }

      setScanResult(response.data);
      
      if (response.data.success) {
        if (markAsCheckedIn) {
          toast.success('Ticket checked in successfully!');
        } else {
          toast.success('Ticket verified!');
        }
      } else {
        toast.error(response.data.error || 'Verification failed');
      }
    } catch (error: any) {
      setScanResult({
        success: false,
        error: error.message || 'An error occurred',
      });
      toast.error('Verification failed');
    } finally {
      setIsScanning(false);
    }
  };

  const handleManualSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualReference.trim()) return;

    // Try to parse as JSON (QR code data)
    try {
      const qrData = JSON.parse(manualReference);
      if (qrData.orderId && qrData.reference) {
        await verifyTicket(qrData.orderId, qrData.reference);
        return;
      }
    } catch {
      // Not JSON, try as plain reference
    }

    // Search by reference number
    const { data: order, error } = await supabase
      .from('orders')
      .select('id, reference')
      .eq('reference', manualReference.trim().toUpperCase())
      .single();

    if (error || !order) {
      setScanResult({
        success: false,
        error: 'Ticket not found with this reference',
      });
      toast.error('Ticket not found');
      return;
    }

    await verifyTicket(order.id, order.reference);
  };

  const handleCheckIn = async () => {
    if (!scanResult?.order) return;

    setIsCheckingIn(true);
    await verifyTicket(scanResult.order.id, scanResult.order.reference, true);
    setIsCheckingIn(false);
  };

  const resetScanner = () => {
    setScanResult(null);
    setManualReference('');
    if (!cameraMode) {
      inputRef.current?.focus();
    }
  };

  const toggleCameraMode = () => {
    setCameraMode(!cameraMode);
    setScanResult(null);
    setManualReference('');
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-2xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center mb-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
              <Scan className="w-8 h-8 text-primary" />
            </div>
            <h1 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-2">
              Ticket Scanner
            </h1>
            <p className="text-muted-foreground">
              Scan QR codes or enter reference numbers to check in attendees
            </p>
          </motion.div>

          {/* Mode Toggle */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="flex justify-center gap-2 mb-6"
          >
            <Button
              variant={cameraMode ? 'outline' : 'default'}
              onClick={() => setCameraMode(false)}
              className="flex-1 max-w-[160px]"
            >
              <Keyboard className="w-4 h-4 mr-2" />
              Manual
            </Button>
            <Button
              variant={cameraMode ? 'default' : 'outline'}
              onClick={() => setCameraMode(true)}
              className="flex-1 max-w-[160px]"
            >
              <Camera className="w-4 h-4 mr-2" />
              Camera
            </Button>
          </motion.div>

          {/* Camera Scanner */}
          {cameraMode && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="mb-6 overflow-hidden">
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    {cameraReady ? (
                      <>
                        <Camera className="w-5 h-5 text-green-500" />
                        Camera Active
                      </>
                    ) : (
                      <>
                        <CameraOff className="w-5 h-5 text-muted-foreground" />
                        Starting Camera...
                      </>
                    )}
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                  <div 
                    id={scannerContainerRef.current}
                    className="w-full aspect-square max-h-[400px] bg-muted"
                  />
                  <div className="p-4 text-center text-sm text-muted-foreground">
                    Point your camera at the QR code on the ticket
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Manual Input */}
          {!cameraMode && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
            >
              <Card className="mb-6">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <QrCode className="w-5 h-5 text-primary" />
                    Enter Reference
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleManualSubmit} className="flex gap-3">
                    <Input
                      ref={inputRef}
                      value={manualReference}
                      onChange={(e) => setManualReference(e.target.value)}
                      placeholder="Scan QR or enter reference (e.g., SH-1234567890-ABC)"
                      className="flex-1 font-mono"
                      autoFocus
                    />
                    <Button type="submit" disabled={isScanning || !manualReference.trim()}>
                      {isScanning ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        'Verify'
                      )}
                    </Button>
                  </form>
                  <p className="text-xs text-muted-foreground mt-2">
                    Connect a barcode/QR scanner to auto-fill this field
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Scan Result */}
          <AnimatePresence mode="wait">
            {scanResult && (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
              >
                <Card className={`border-2 ${
                  scanResult.success 
                    ? scanResult.order?.checked_in 
                      ? 'border-yellow-500 bg-yellow-500/5'
                      : 'border-green-500 bg-green-500/5'
                    : 'border-destructive bg-destructive/5'
                }`}>
                  <CardContent className="pt-6">
                    {scanResult.success && scanResult.order ? (
                      <div className="space-y-6">
                        {/* Status Banner */}
                        <div className={`flex items-center justify-center gap-2 py-3 rounded-lg ${
                          scanResult.order.checked_in 
                            ? 'bg-yellow-500/20 text-yellow-600'
                            : 'bg-green-500/20 text-green-600'
                        }`}>
                          {scanResult.order.checked_in ? (
                            <>
                              <AlertTriangle className="w-6 h-6" />
                              <span className="font-semibold text-lg">Already Checked In</span>
                            </>
                          ) : (
                            <>
                              <Check className="w-6 h-6" />
                              <span className="font-semibold text-lg">Valid Ticket</span>
                            </>
                          )}
                        </div>

                        {/* Ticket Details */}
                        <div className="space-y-4">
                          <div className="text-center">
                            <h3 className="font-display text-xl font-bold text-foreground">
                              {scanResult.order.show.title}
                            </h3>
                            <p className="text-sm text-muted-foreground font-mono">
                              {scanResult.order.reference}
                            </p>
                          </div>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span>{scanResult.order.show.venue}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Calendar className="w-4 h-4 text-primary" />
                              <span>{format(new Date(scanResult.order.show.date), 'MMM d, yyyy')}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Clock className="w-4 h-4 text-primary" />
                              <span>{scanResult.order.show.time}</span>
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              <Ticket className="w-4 h-4 text-primary" />
                              <span>{scanResult.order.ticket_tier.name} × {scanResult.order.quantity}</span>
                            </div>
                          </div>

                          {scanResult.order.seat_info && (
                            <div className="text-center p-3 bg-muted/50 rounded-lg">
                              <p className="text-xs text-muted-foreground">Assigned Seats</p>
                              <p className="font-semibold text-foreground">{scanResult.order.seat_info}</p>
                            </div>
                          )}

                          {scanResult.order.checked_in && scanResult.order.checked_in_at && (
                            <div className="text-center text-sm text-muted-foreground">
                              Checked in at {format(new Date(scanResult.order.checked_in_at), 'h:mm a')}
                            </div>
                          )}
                        </div>

                        {/* Actions */}
                        <div className="flex gap-3">
                          <Button
                            variant="outline"
                            className="flex-1"
                            onClick={resetScanner}
                          >
                            Scan Next
                          </Button>
                          {!scanResult.order.checked_in && (
                            <Button
                              variant="gradient"
                              className="flex-1"
                              onClick={handleCheckIn}
                              disabled={isCheckingIn}
                            >
                              {isCheckingIn ? (
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                              ) : (
                                <Check className="w-4 h-4 mr-2" />
                              )}
                              Check In
                            </Button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <div className="text-center space-y-4 py-4">
                        <div className="w-16 h-16 rounded-full bg-destructive/20 flex items-center justify-center mx-auto">
                          <X className="w-8 h-8 text-destructive" />
                        </div>
                        <div>
                          <h3 className="font-semibold text-lg text-foreground">Invalid Ticket</h3>
                          <p className="text-muted-foreground">{scanResult.error}</p>
                        </div>
                        <Button variant="outline" onClick={resetScanner}>
                          Try Again
                        </Button>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Instructions */}
          {!scanResult && !cameraMode && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-center text-muted-foreground text-sm mt-8"
            >
              <p className="mb-2">How to use:</p>
              <ol className="list-decimal list-inside space-y-1 text-left max-w-sm mx-auto">
                <li>Use Camera mode for mobile QR scanning</li>
                <li>Or manually enter the ticket reference number</li>
                <li>Verify the ticket details</li>
                <li>Click "Check In" to mark the attendee as checked in</li>
              </ol>
            </motion.div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default TicketScanner;
