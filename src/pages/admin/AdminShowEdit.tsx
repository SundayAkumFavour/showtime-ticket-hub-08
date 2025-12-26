import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useShow, useUpdateShow } from '@/hooks/useShows';
import { ShowForm, ShowFormData } from '@/components/admin/ShowForm';
import { getShowStatus } from '@/types/show';
import { motion } from 'framer-motion';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Loader2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const AdminShowEdit = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { data: show, isLoading, error } = useShow(id || '');
  const updateShow = useUpdateShow();

  const handleSubmit = (data: ShowFormData) => {
    if (!id) return;
    
    updateShow.mutate({ id, ...data }, {
      onSuccess: () => {
        toast.success('Show updated successfully!');
        navigate('/admin/shows');
      },
      onError: (error) => {
        toast.error('Failed to update show: ' + error.message);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 md:pt-28 pb-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (error || !show) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 md:pt-28 pb-16">
          <div className="container mx-auto px-4 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-destructive" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Show Not Found</h1>
            <p className="text-muted-foreground mb-4">The show you're looking for doesn't exist.</p>
            <Link to="/admin/shows">
              <Button variant="gradient">Back to Shows</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const isPassed = getShowStatus(show) === 'passed';

  if (isPassed) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="pt-24 md:pt-28 pb-16">
          <div className="container mx-auto px-4 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-amber-500" />
            <h1 className="text-2xl font-bold text-foreground mb-2">Cannot Edit Passed Show</h1>
            <p className="text-muted-foreground mb-4">
              This show has already passed and cannot be edited for ticket sales.
            </p>
            <Link to="/admin/shows">
              <Button variant="gradient">Back to Shows</Button>
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <main className="pt-24 md:pt-28 pb-16">
        <div className="container mx-auto px-4 max-w-3xl">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <Link to="/admin/shows">
              <Button variant="ghost" size="sm" className="mb-4">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Shows
              </Button>
            </Link>
            <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground mb-2">
              Edit Show
            </h1>
            <p className="text-muted-foreground">
              Update the details for "{show.title}"
            </p>
          </motion.div>

          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="glass-card p-6 md:p-8 rounded-2xl"
          >
            <ShowForm
              initialData={show}
              onSubmit={handleSubmit}
              onCancel={() => navigate('/admin/shows')}
              isLoading={updateShow.isPending}
            />
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminShowEdit;
