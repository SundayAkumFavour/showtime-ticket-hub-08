import { useRef, useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { TicketQRCode } from './TicketQRCode';
import { Download, Printer, Check, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import html2canvas from 'html2canvas';

interface TicketDownloadModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: {
    id: string;
    reference: string;
    quantity: number;
    checked_in?: boolean;
    show?: {
      title: string;
      venue: string;
      date: string;
      time: string;
    };
    ticket_tier?: {
      name: string;
    };
    seat_ids?: string[];
  };
  seatInfo?: string;
}

export const TicketDownloadModal = ({ isOpen, onClose, order, seatInfo }: TicketDownloadModalProps) => {
  const ticketRef = useRef<HTMLDivElement>(null);
  const [isDownloading, setIsDownloading] = useState(false);

  const handleDownload = async () => {
    if (!ticketRef.current) return;

    setIsDownloading(true);
    try {
      const canvas = await html2canvas(ticketRef.current, {
        backgroundColor: '#ffffff',
        scale: 2,
      });

      const link = document.createElement('a');
      link.download = `ticket-${order.reference}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();

      toast.success('Ticket downloaded successfully!');
    } catch (error) {
      console.error('Download error:', error);
      toast.error('Failed to download ticket');
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow || !ticketRef.current) return;

    const ticketHtml = ticketRef.current.outerHTML;
    
    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Ticket - ${order.reference}</title>
        <style>
          body { 
            margin: 0; 
            padding: 20px;
            display: flex;
            justify-content: center;
            font-family: system-ui, sans-serif;
          }
          @media print {
            body { padding: 0; }
          }
        </style>
      </head>
      <body>
        ${ticketHtml}
      </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 250);
  };

  if (!order.show) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            Your Ticket
            {order.checked_in && (
              <span className="inline-flex items-center gap-1 text-xs bg-green-500/20 text-green-500 px-2 py-1 rounded-full">
                <Check className="w-3 h-3" /> Checked In
              </span>
            )}
          </DialogTitle>
        </DialogHeader>

        <TicketQRCode
          ref={ticketRef}
          orderId={order.id}
          reference={order.reference}
          showTitle={order.show.title}
          venue={order.show.venue}
          date={order.show.date}
          time={order.show.time}
          ticketTier={order.ticket_tier?.name || 'General'}
          quantity={order.quantity}
          seatInfo={seatInfo}
        />

        <div className="flex gap-3 mt-4">
          <Button
            variant="outline"
            className="flex-1"
            onClick={handlePrint}
          >
            <Printer className="w-4 h-4 mr-2" />
            Print
          </Button>
          <Button
            variant="gradient"
            className="flex-1"
            onClick={handleDownload}
            disabled={isDownloading}
          >
            {isDownloading ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Download className="w-4 h-4 mr-2" />
            )}
            Download
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
