import { Navbar } from '@/components/Navbar';
import { Footer } from '@/components/Footer';
import { useCreateShow } from '@/hooks/useShows';
import { ShowForm, ShowFormData } from '@/components/admin/ShowForm';
import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { toast } from 'sonner';

const AdminShowCreate = () => {
  const navigate = useNavigate();
  const createShow = useCreateShow();

  const handleSubmit = (data: ShowFormData) => {
    createShow.mutate(data, {
      onSuccess: () => {
        toast.success('Show created successfully!');
        navigate('/admin/shows');
      },
      onError: (error) => {
        toast.error('Failed to create show: ' + error.message);
      },
    });
  };

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
              Create New Show
            </h1>
            <p className="text-muted-foreground">
              Fill in the details below to create a new event
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
              onSubmit={handleSubmit}
              onCancel={() => navigate('/admin/shows')}
              isLoading={createShow.isPending}
            />
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminShowCreate;
