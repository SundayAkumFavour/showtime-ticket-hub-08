import { useEffect, useState } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { usePaystack } from '@/hooks/usePaystack';
import { motion } from 'framer-motion';
import { CheckCircle, XCircle, Loader2, Ticket } from 'lucide-react';

const PaymentVerify = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { verifyPayment } = usePaystack();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderRef, setOrderRef] = useState<string>('');

  useEffect(() => {
    const reference = searchParams.get('reference');
    
    if (!reference) {
      setStatus('failed');
      return;
    }

    setOrderRef(reference);

    const verify = async () => {
      const result = await verifyPayment(reference);
      if (result?.success) {
        setStatus('success');
      } else {
        setStatus('failed');
      }
    };

    verify();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-lg">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card p-8 rounded-2xl text-center"
          >
            {status === 'loading' && (
              <>
                <Loader2 className="w-16 h-16 text-primary mx-auto mb-6 animate-spin" />
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Verifying Payment
                </h1>
                <p className="text-muted-foreground">
                  Please wait while we confirm your payment...
                </p>
              </>
            )}

            {status === 'success' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                >
                  <CheckCircle className="w-20 h-20 text-emerald-500 mx-auto mb-6" />
                </motion.div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Payment Successful!
                </h1>
                <p className="text-muted-foreground mb-4">
                  Your tickets have been confirmed. Order reference:
                </p>
                <p className="font-mono text-lg text-primary mb-6">{orderRef}</p>
                <div className="flex flex-col gap-3">
                  <Link to="/dashboard">
                    <Button variant="gradient" size="lg" className="w-full">
                      <Ticket className="w-5 h-5 mr-2" />
                      View My Tickets
                    </Button>
                  </Link>
                  <Link to="/shows">
                    <Button variant="outline" size="lg" className="w-full">
                      Browse More Shows
                    </Button>
                  </Link>
                </div>
              </>
            )}

            {status === 'failed' && (
              <>
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', duration: 0.5 }}
                >
                  <XCircle className="w-20 h-20 text-destructive mx-auto mb-6" />
                </motion.div>
                <h1 className="font-display text-2xl font-bold text-foreground mb-2">
                  Payment Failed
                </h1>
                <p className="text-muted-foreground mb-6">
                  We couldn't verify your payment. Please try again or contact support.
                </p>
                <div className="flex flex-col gap-3">
                  <Link to="/shows">
                    <Button variant="gradient" size="lg" className="w-full">
                      Try Again
                    </Button>
                  </Link>
                  <Link to="/">
                    <Button variant="outline" size="lg" className="w-full">
                      Go Home
                    </Button>
                  </Link>
                </div>
              </>
            )}
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PaymentVerify;
