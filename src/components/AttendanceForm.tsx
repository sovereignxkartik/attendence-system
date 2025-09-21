import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { MapPin, Clock, CheckCircle, AlertCircle, Loader2, QrCode } from 'lucide-react';
import { AttendanceFormData, SECTIONS, EVENTS } from '@/types/attendance';
import { getCurrentLocation, validateLocation } from '@/utils/locationUtils';
import { useSupabaseAttendance } from '@/hooks/useSupabaseAttendance';
import { useAttendanceSettings } from '@/hooks/useAttendanceSettings';
import { useToast } from '@/hooks/use-toast';

interface AttendanceFormProps {
  onSuccess?: () => void;
}

export function AttendanceForm({ onSuccess }: AttendanceFormProps) {
  const [formData, setFormData] = useState<AttendanceFormData>({
    studentName: '',
    rollNumber: '',
    section: SECTIONS[0], // Default to first section
    event: EVENTS[0] // Default to first event
  });
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'checking' | 'valid' | 'invalid'>('idle');
  const [locationMessage, setLocationMessage] = useState('');
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [isQrScanned, setIsQrScanned] = useState(false);
  
  const { submitAttendance } = useSupabaseAttendance();
  const { isAttendanceAllowed, getTimeStatus, settings: attendanceSettings } = useAttendanceSettings();
  const { toast } = useToast();
  
  // Check for URL parameters on component mount
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const sectionParam = params.get('section');
    const eventParam = params.get('event');
    
    if (sectionParam || eventParam) {
      setIsQrScanned(true);
      setFormData(prev => ({
        ...prev,
        ...(sectionParam && SECTIONS.includes(sectionParam as any) && { section: sectionParam as any }),
        ...(eventParam && EVENTS.includes(eventParam as any) && { event: eventParam as any })
      }));
      
      if (sectionParam && eventParam) {
        toast({
          title: "QR Code Scanned!",
          description: `Pre-filled for ${sectionParam} - ${eventParam}`,
        });
      }
    }
  }, [toast]);

  const handleInputChange = (field: keyof AttendanceFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = (): boolean => {
    return !!(formData.studentName && formData.rollNumber && formData.section && formData.event);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields.",
        variant: "destructive"
      });
      return;
    }

    if (!isAttendanceAllowed()) {
      const timeStatus = getTimeStatus();
      toast({
        title: "Attendance Not Available",
        description: timeStatus.message,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setLocationStatus('checking');
    setLocationMessage('Verifying your location...');

    try {
      const userLocation = await getCurrentLocation();
      const locationValidation = validateLocation(userLocation);
      
      if (!locationValidation.isValid) {
        setLocationStatus('invalid');
        setLocationMessage(locationValidation.message);
        toast({
          title: "Location Error",
          description: locationValidation.message,
          variant: "destructive"
        });
        setIsSubmitting(false);
        return;
      }

      setLocationStatus('valid');
      setLocationMessage(locationValidation.message);

      const result = await submitAttendance(formData, userLocation);
      
      if (result.success) {
        setIsSubmitted(true);
        toast({
          title: "Success!",
          description: "Attendance marked successfully!",
        });
        onSuccess?.();
      } else {
        toast({
          title: "Submission Failed",
          description: result.error || "Failed to mark attendance",
          variant: "destructive"
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to verify location. Please try again.",
        variant: "destructive"
      });
      setLocationStatus('invalid');
      setLocationMessage('Failed to get location. Please enable location services.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isSubmitted) {
    return (
      <Card className="max-w-md mx-auto">
        <CardContent className="text-center py-12">
          <CheckCircle className="w-16 h-16 text-success mx-auto mb-4" />
          <h3 className="text-2xl font-semibold text-success mb-2">Attendance Marked!</h3>
          <p className="text-muted-foreground mb-6">
            Your attendance has been successfully recorded for {formData.event}.
          </p>
          <Button onClick={() => {
            setIsSubmitted(false);
            setFormData({ studentName: '', rollNumber: '', section: SECTIONS[0], event: EVENTS[0] });
            setLocationStatus('idle');
            setLocationMessage('');
          }}>
            Mark Another Attendance
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="text-2xl font-bold text-primary flex items-center justify-center gap-2">
          {isQrScanned && <QrCode className="w-6 h-6" />}
          Student Attendance
        </CardTitle>
        <CardDescription>
          {isQrScanned ? "QR Code scanned! Please complete your attendance below." : "Mark your attendance for today's event"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* Attendance Status Alert */}
        {attendanceSettings && (
          <Alert className={`mb-6 ${getTimeStatus().allowed ? "border-green-500 bg-green-50" : "border-red-500 bg-red-50"}`}>
            {getTimeStatus().allowed ? (
              <CheckCircle className="h-4 w-4 text-green-600" />
            ) : (
              <AlertCircle className="h-4 w-4 text-red-600" />
            )}
            <AlertDescription className={getTimeStatus().allowed ? "text-green-700" : "text-red-700"}>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                {getTimeStatus().message}
              </div>
            </AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="studentName">Full Name *</Label>
            <Input
              id="studentName"
              type="text"
              value={formData.studentName}
              onChange={(e) => handleInputChange('studentName', e.target.value)}
              placeholder="Enter your full name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="rollNumber">Roll Number / Student ID *</Label>
            <Input
              id="rollNumber"
              type="text"
              value={formData.rollNumber}
              onChange={(e) => handleInputChange('rollNumber', e.target.value)}
              placeholder="Enter your roll number"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="section">Section *</Label>
            <Select 
              value={formData.section} 
              onValueChange={(value) => handleInputChange('section', value)}
              disabled={isQrScanned}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select your section" />
              </SelectTrigger>
              <SelectContent>
                {SECTIONS.map((section) => (
                  <SelectItem key={section} value={section}>
                    {section}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isQrScanned && (
              <p className="text-xs text-muted-foreground">Pre-filled from QR code</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="event">Event</Label>
            <Select 
              value={formData.event} 
              onValueChange={(value) => handleInputChange('event', value)}
              disabled={isQrScanned}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {EVENTS.map((event) => (
                  <SelectItem key={event} value={event}>
                    {event}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isQrScanned && (
              <p className="text-xs text-muted-foreground">Pre-filled from QR code</p>
            )}
          </div>

          {locationMessage && (
            <Alert className={`${
              locationStatus === 'valid' ? 'bg-success/10 border-success text-success' :
              locationStatus === 'invalid' ? 'bg-destructive/10 border-destructive text-destructive' :
              'bg-primary/10 border-primary text-primary'
            }`}>
              <div className="flex items-center gap-2">
                {locationStatus === 'checking' && <Loader2 className="w-4 h-4 animate-spin" />}
                {locationStatus === 'valid' && <MapPin className="w-4 h-4" />}
                {locationStatus === 'invalid' && <AlertCircle className="w-4 h-4" />}
                <AlertDescription>{locationMessage}</AlertDescription>
              </div>
            </Alert>
          )}

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isSubmitting || !validateForm() || !getTimeStatus().allowed}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Clock className="w-4 h-4 mr-2" />
                Mark Attendance
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}