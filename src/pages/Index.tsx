import React from 'react';
import { Button } from '@/components/ui/button';
import { Shield, GraduationCap } from 'lucide-react';
import { AttendanceForm } from '@/components/AttendanceForm';
import { useNavigate } from 'react-router-dom';

const Index = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-primary/5 to-accent/10">
      {/* Header */}
      <header className="bg-card/80 backdrop-blur-sm border-b border-border">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <GraduationCap className="w-8 h-8 text-primary" />
              <h1 className="text-2xl font-bold">GLBITM SAS</h1>
            </div>
            <Button 
              variant="outline" 
              onClick={() => navigate('/auth')}
              className="flex items-center gap-2"
            >
              <Shield className="w-4 h-4" />
              Admin Login
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-foreground mb-4">
            Mark Your Attendance
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Quick and secure attendance marking with location verification. 
            Fill in your details below to record your presence at today's event.
          </p>
        </div>

        <AttendanceForm />
      </main>
    </div>
  );
};

export default Index;
