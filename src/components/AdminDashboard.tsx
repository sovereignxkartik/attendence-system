import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Download, Users, Calendar, Filter, Loader2, QrCode, Clock, Settings } from 'lucide-react';
import { SECTIONS, EVENTS } from '@/types/attendance';
import { useSupabaseAttendance } from '@/hooks/useSupabaseAttendance';
import { useAttendanceSettings } from '@/hooks/useAttendanceSettings';
import { Switch } from '@/components/ui/switch';
import QRCode from 'react-qr-code';

export function AdminDashboard() {
  // Force rebuild to clear RefreshCw caching issue
  const [filters, setFilters] = useState({
    section: 'all-sections',
    event: 'all-events',
    search: ''
  });
  
  const [qrSection, setQrSection] = useState<string>('');
  const [qrEvent, setQrEvent] = useState<string>('');
  const [showQrDialog, setShowQrDialog] = useState(false);
  
  // Attendance settings state
  const [openingTime, setOpeningTime] = useState('09:00');
  const [closingTime, setClosingTime] = useState('17:00');

  const { attendanceRecords, getFilteredRecords, exportToCSV, totalRecords, loading } = useSupabaseAttendance();
  const { 
    settings: attendanceSettings, 
    loading: settingsLoading, 
    updateSettings, 
    getTimeStatus 
  } = useAttendanceSettings();

  const filteredRecords = getFilteredRecords({
    section: filters.section && filters.section !== 'all-sections' ? filters.section : undefined,
    event: filters.event && filters.event !== 'all-events' ? filters.event : undefined,
    search: filters.search || undefined
  });

  // Initialize time inputs when settings load
  React.useEffect(() => {
    if (attendanceSettings) {
      setOpeningTime(attendanceSettings.opening_time.slice(0, 5)); // Remove seconds
      setClosingTime(attendanceSettings.closing_time.slice(0, 5)); // Remove seconds
    }
  }, [attendanceSettings]);

  const handleExport = () => {
    exportToCSV(filteredRecords);
  };
  
  const generateQrCodeUrl = () => {
    const baseUrl = window.location.origin;
    const params = new URLSearchParams();
    if (qrSection) params.append('section', qrSection);
    if (qrEvent) params.append('event', qrEvent);
    return `${baseUrl}/?${params.toString()}`;
  };
  
  const handleGenerateQr = () => {
    if (!qrSection || !qrEvent) {
      alert('Please select both section and event to generate QR code');
      return;
    }
    setShowQrDialog(true);
  };
  
  const downloadQrCode = () => {
    const svg = document.getElementById('qr-code-svg');
    if (!svg) return;
    
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      
      const link = document.createElement('a');
      link.download = `attendance-qr-${qrSection.replace(/\s+/g, '-')}-${qrEvent.replace(/\s+/g, '-')}.png`;
      link.href = canvas.toDataURL('image/png');
      link.click();
    };
    
    img.src = 'data:image/svg+xml;base64,' + btoa(svgData);
  };

  const handleTimeSettingsUpdate = async () => {
    await updateSettings({
      opening_time: `${openingTime}:00`,
      closing_time: `${closingTime}:00`,
      is_enabled: attendanceSettings?.is_enabled ?? true
    });
  };

  const handleToggleAttendance = async (enabled: boolean) => {
    await updateSettings({
      is_enabled: enabled
    });
  };

  const timeStatus = getTimeStatus();

  const getSectionColor = (section: string) => {
    const colors = {
      'Section A': 'bg-blue-100 text-blue-800',
      'Section B': 'bg-green-100 text-green-800',
      'Section C': 'bg-purple-100 text-purple-800',
      'Section D': 'bg-orange-100 text-orange-800'
    };
    return colors[section as keyof typeof colors] || 'bg-gray-100 text-gray-800';
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="flex items-center p-6">
            <Users className="w-8 h-8 text-primary mr-4" />
            <div>
              <p className="text-2xl font-bold">{totalRecords}</p>
              <p className="text-muted-foreground">Total Attendance</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Calendar className="w-8 h-8 text-accent mr-4" />
            <div>
              <p className="text-2xl font-bold">{EVENTS.length}</p>
              <p className="text-muted-foreground">Active Events</p>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="flex items-center p-6">
            <Filter className="w-8 h-8 text-warning mr-4" />
            <div>
              <p className="text-2xl font-bold">{filteredRecords.length}</p>
              <p className="text-muted-foreground">Filtered Results</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Time Control */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Attendance Time Control
          </CardTitle>
          <CardDescription>
            Set the opening and closing times for attendance marking
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {/* Current Status */}
            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="font-medium">Current Status</p>
                  <p className={`text-sm ${timeStatus.allowed ? 'text-green-600' : 'text-red-600'}`}>
                    {timeStatus.message}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Label htmlFor="attendance-toggle" className="text-sm">
                  {attendanceSettings?.is_enabled ? 'Enabled' : 'Disabled'}
                </Label>
                <Switch
                  id="attendance-toggle"
                  checked={attendanceSettings?.is_enabled ?? false}
                  onCheckedChange={handleToggleAttendance}
                  disabled={settingsLoading}
                />
              </div>
            </div>

            {/* Time Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label>Opening Time</Label>
                <Input
                  type="time"
                  value={openingTime}
                  onChange={(e) => setOpeningTime(e.target.value)}
                  disabled={settingsLoading}
                />
              </div>
              
              <div className="space-y-2">
                <Label>Closing Time</Label>
                <Input
                  type="time"
                  value={closingTime}
                  onChange={(e) => setClosingTime(e.target.value)}
                  disabled={settingsLoading}
                />
              </div>
              
              <div className="flex items-end">
                <Button
                  onClick={handleTimeSettingsUpdate}
                  disabled={settingsLoading}
                  className="w-full"
                >
                  {settingsLoading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <Clock className="w-4 h-4 mr-2" />
                  )}
                  Update Times
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* QR Code Generation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <QrCode className="w-5 h-5" />
            Generate Attendance QR Code
          </CardTitle>
          <CardDescription>
            Create QR codes for specific sections and events that students can scan to mark attendance
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={qrSection} onValueChange={setQrSection}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Section" />
                </SelectTrigger>
                <SelectContent>
                  {SECTIONS.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Event</Label>
              <Select value={qrEvent} onValueChange={setQrEvent}>
                <SelectTrigger>
                  <SelectValue placeholder="Select Event" />
                </SelectTrigger>
                <SelectContent>
                  {EVENTS.map((event) => (
                    <SelectItem key={event} value={event}>
                      {event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-end">
              <Dialog open={showQrDialog} onOpenChange={setShowQrDialog}>
                <DialogTrigger asChild>
                  <Button 
                    onClick={handleGenerateQr}
                    disabled={!qrSection || !qrEvent}
                    className="w-full"
                  >
                    <QrCode className="w-4 h-4 mr-2" />
                    Generate QR Code
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Attendance QR Code</DialogTitle>
                    <DialogDescription>
                      QR Code for {qrSection} - {qrEvent}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex flex-col items-center space-y-4">
                    <div className="bg-white p-4 rounded-lg">
                      <QRCode
                        id="qr-code-svg"
                        value={generateQrCodeUrl()}
                        size={200}
                        level="M"
                      />
                    </div>
                    <div className="text-center space-y-2">
                      <p className="text-sm text-muted-foreground">
                        Students can scan this QR code to mark attendance
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={downloadQrCode} variant="outline">
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                        <Button onClick={() => setShowQrDialog(false)}>
                          Close
                        </Button>
                      </div>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filter Attendance Records</CardTitle>
          <CardDescription>
            Filter and export attendance data by section, event, or student details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-4">
            <div className="space-y-2">
              <Label>Search Student</Label>
              <Input
                placeholder="Name or Roll Number"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
            
            <div className="space-y-2">
              <Label>Section</Label>
              <Select value={filters.section} onValueChange={(value) => setFilters(prev => ({ ...prev, section: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sections" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-sections">All Sections</SelectItem>
                  {SECTIONS.map((section) => (
                    <SelectItem key={section} value={section}>
                      {section}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>Event</Label>
              <Select value={filters.event} onValueChange={(value) => setFilters(prev => ({ ...prev, event: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder="All Events" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all-events">All Events</SelectItem>
                  {EVENTS.map((event) => (
                    <SelectItem key={event} value={event}>
                      {event}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button onClick={handleExport} disabled={filteredRecords.length === 0} className="w-full sm:w-auto">
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Attendance Table */}
      <Card>
        <CardHeader>
          <CardTitle>Attendance Records</CardTitle>
          <CardDescription>
            {filteredRecords.length} of {totalRecords} records shown
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto mb-4 animate-spin text-primary" />
              <p className="text-muted-foreground">Loading attendance records...</p>
            </div>
          ) : filteredRecords.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No attendance records found</p>
              <p className="text-sm">Try adjusting your filters or check back later</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Student Name</TableHead>
                    <TableHead>Roll Number</TableHead>
                    <TableHead>Section</TableHead>
                    <TableHead>Event</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Location</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.student_name}</TableCell>
                      <TableCell>{record.roll_number}</TableCell>
                      <TableCell>
                        <Badge className={getSectionColor(record.section)}>
                          {record.section}
                        </Badge>
                      </TableCell>
                      <TableCell>{record.event}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div>{new Date(record.created_at).toLocaleDateString()}</div>
                          <div className="text-muted-foreground">
                            {new Date(record.created_at).toLocaleTimeString()}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-xs text-muted-foreground">
                          <div>Lat: {record.latitude.toString()}</div>
                          <div>Lng: {record.longitude.toString()}</div>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}