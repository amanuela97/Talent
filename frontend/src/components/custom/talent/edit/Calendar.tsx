import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { toast } from 'sonner';
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import { DateSelectArg, EventClickArg } from '@fullcalendar/core/index.js';
import axiosInstance from '@/app/utils/axios';

// Event type definitions
interface CalendarEvent {
  id: string;
  title: string;
  start: string;
  end: string;
  type: 'AVAILABLE' | 'UNAVAILABLE' | 'BOOKED';
  color?: string;
  clientName?: string;
  isAllDay: boolean;
}

// New event form data
interface EventFormData {
  title: string;
  type: 'AVAILABLE' | 'UNAVAILABLE' | 'BOOKED';
  clientName: string;
  start: string;
  end: string;
  isAllDay: boolean;
}

interface CalendarEditorProps {
  talentId: string;
}

// Color mapping for event types
const eventColors = {
  AVAILABLE: '#22c55e', // green
  UNAVAILABLE: '#ef4444', // red
  BOOKED: '#3b82f6', // blue
};

export default function CalendarEditor({ talentId }: CalendarEditorProps) {
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewEventModal, setShowNewEventModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{
    id: string;
    title: string;
  } | null>(null);
  const [showRecurringModal, setShowRecurringModal] = useState(false);
  const [newEventData, setNewEventData] = useState<EventFormData>({
    title: '',
    type: 'AVAILABLE',
    clientName: '',
    start: '',
    end: '',
    isAllDay: false,
  });
  const [recurringOptions, setRecurringOptions] = useState({
    frequency: 'weekly', // 'daily', 'weekly', 'monthly'
    days: [] as string[],
    startDate: '',
    endDate: '',
    occurrences: 4,
  });
  const [selectedDates, setSelectedDates] = useState<{
    start: Date;
    end: Date;
  } | null>(null);
  const calendarRef = useRef<FullCalendar | null>(null);

  // Fetch events from API
  const fetchEvents = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data } = await axiosInstance.get(`/calendar-events/${talentId}`);
      setEvents(data);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast.error('Failed to load calendar events');
    } finally {
      setIsLoading(false);
    }
  }, [talentId]);

  // Fetch events on component mount
  useEffect(() => {
    fetchEvents();
  }, [fetchEvents]);

  // Handle date click or selection
  const handleDateSelect = (selectInfo: DateSelectArg) => {
    setSelectedDates({
      start: selectInfo.start,
      end: selectInfo.end,
    });

    // Pre-fill the form with selected dates
    const startDate = new Date(selectInfo.start);
    const endDate = new Date(selectInfo.end);

    // Check if this is likely an all-day selection
    const isAllDay =
      selectInfo.allDay ||
      (startDate.getHours() === 0 &&
        startDate.getMinutes() === 0 &&
        endDate.getHours() === 0 &&
        endDate.getMinutes() === 0 &&
        (endDate.getTime() - startDate.getTime()) % (24 * 60 * 60 * 1000) ===
          0);

    setNewEventData({
      ...newEventData,
      start: formatDateForInput(startDate),
      end: formatDateForInput(endDate),
      isAllDay,
    });

    setShowNewEventModal(true);
  };

  // Format date for datetime-local input
  const formatDateForInput = (date: Date): string => {
    return new Date(date.getTime() - date.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 16);
  };

  // Handle new event form submission
  const handleCreateEvent = async () => {
    try {
      // Validate form data
      if (!newEventData.title) {
        return toast.error('Please enter a title for the event');
      }

      if (!newEventData.start || !newEventData.end) {
        return toast.error('Please select start and end times');
      }

      // Create event payload
      const eventPayload = {
        ...newEventData,
        color: eventColors[newEventData.type],
      };

      // Submit to API
      console.log('talentId', talentId);
      const { data: createdEvent } = await axiosInstance.post(
        `/calendar-events/${talentId}`,
        eventPayload
      );

      // Check for error response
      if (createdEvent.statusCode >= 400) {
        throw new Error(createdEvent.message || 'Failed to create event');
      }

      // Update local state
      setEvents([...events, createdEvent]);
      setShowNewEventModal(false);
      resetEventForm();

      toast.success('Event created successfully');
    } catch (error) {
      console.error('Error creating event:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to create event'
      );
    }
  }; // Delete an event
  const handleDeleteEvent = async (eventId: string) => {
    try {
      const { data } = await axiosInstance.delete(
        `/calendar-events/event/${eventId}`
      );

      // Check for error response
      if (data && data.statusCode >= 400) {
        throw new Error(data.message || 'Failed to delete event');
      }

      // Update local state
      setEvents(events.filter((event) => event.id !== eventId));
      toast.success('Event deleted successfully');
      setShowDeleteModal(false);
      setEventToDelete(null);
    } catch (error) {
      console.error('Error deleting event:', error);
      toast.error(
        error instanceof Error ? error.message : 'Failed to delete event'
      );
    }
  };

  // Handle event click
  const handleEventClick = (clickInfo: EventClickArg) => {
    // Set the event to delete and show the delete confirmation modal
    setEventToDelete({
      id: clickInfo.event.id,
      title: clickInfo.event.title,
    });
    setShowDeleteModal(true);
  };

  // Reset the new event form
  const resetEventForm = () => {
    setNewEventData({
      title: '',
      type: 'AVAILABLE',
      clientName: '',
      start: '',
      end: '',
      isAllDay: false,
    });
    setSelectedDates(null);
  };

  // Handle form field changes
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewEventData({
      ...newEventData,
      [name]: value,
    });
  };

  // Handle radio button changes for event type
  const handleTypeChange = (value: 'AVAILABLE' | 'UNAVAILABLE' | 'BOOKED') => {
    setNewEventData({
      ...newEventData,
      type: value,
      // Set a default title based on the type
      title:
        value === 'AVAILABLE'
          ? 'Available'
          : value === 'UNAVAILABLE'
          ? 'Unavailable'
          : newEventData.title || 'Booked',
    });
  };

  // Handle checkbox change for all-day event
  const handleAllDayChange = (checked: boolean) => {
    setNewEventData({
      ...newEventData,
      isAllDay: checked,
    });
  };

  // Create recurring events
  const handleCreateRecurringEvents = async () => {
    try {
      if (!newEventData.title) {
        return toast.error('Please enter a title for the events');
      }

      if (!recurringOptions.startDate || !recurringOptions.endDate) {
        return toast.error(
          'Please select start and end dates for the recurring events'
        );
      }

      const startDate = new Date(recurringOptions.startDate);
      const endDate = new Date(recurringOptions.endDate);

      if (startDate > endDate) {
        return toast.error('End date must be after start date');
      }

      // Calculate dates based on frequency and selected days
      const dates: Date[] = [];
      const currentDate = new Date(startDate);

      // Set time to 9:00 AM for default time
      currentDate.setHours(9, 0, 0, 0);

      // Generate dates based on frequency
      while (
        currentDate <= endDate &&
        dates.length < recurringOptions.occurrences
      ) {
        const day = currentDate.getDay(); // 0 = Sunday, 1 = Monday, etc.
        const dayNames = [
          'sunday',
          'monday',
          'tuesday',
          'wednesday',
          'thursday',
          'friday',
          'saturday',
        ];

        if (
          recurringOptions.frequency === 'daily' ||
          (recurringOptions.frequency === 'weekly' &&
            (recurringOptions.days.length === 0 ||
              recurringOptions.days.includes(dayNames[day])))
        ) {
          dates.push(new Date(currentDate));
        }

        // Increment based on frequency
        if (recurringOptions.frequency === 'daily') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (recurringOptions.frequency === 'weekly') {
          currentDate.setDate(currentDate.getDate() + 1);
        } else if (recurringOptions.frequency === 'monthly') {
          currentDate.setMonth(currentDate.getMonth() + 1);
        }
      }

      // Create events for each date
      const createdEvents = [];
      for (const date of dates) {
        const endTime = new Date(date);
        endTime.setHours(date.getHours() + 1); // Default 1 hour duration

        const eventPayload = {
          ...newEventData,
          start: date.toISOString(),
          end: endTime.toISOString(),
          color: eventColors[newEventData.type],
        };

        const { data: createdEvent } = await axiosInstance.post(
          `/calendar-events/${talentId}`,
          eventPayload
        );

        if (createdEvent.statusCode >= 400) {
          throw new Error(
            createdEvent.message || 'Failed to create recurring events'
          );
        }

        createdEvents.push(createdEvent);
      }

      // Update local state
      setEvents([...events, ...createdEvents]);
      setShowRecurringModal(false);
      resetEventForm();

      toast.success(`Created ${createdEvents.length} recurring events`);
    } catch (error) {
      console.error('Error creating recurring events:', error);
      toast.error(
        error instanceof Error
          ? error.message
          : 'Failed to create recurring events'
      );
    }
  };

  return (
    <div className="flex-1 p-6 space-y-6">
      <div className="bg-white rounded-md shadow-sm">
        <div className="border-b p-6 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Calendar</h1>
            <p className="text-gray-600 mt-2">
              Manage your availability and bookings
            </p>
          </div>
          <div className="flex gap-3">
            <Button
              onClick={() => {
                resetEventForm();
                setShowNewEventModal(true);
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              Add Event
            </Button>
            <Button
              onClick={() => {
                resetEventForm();
                setShowRecurringModal(true);
              }}
              variant="outline"
              className="border-blue-600 text-blue-600 hover:bg-blue-50"
            >
              Add Recurring Events
            </Button>
          </div>
        </div>

        <div className="p-6">
          {isLoading ? (
            <div className="flex justify-center items-center h-96">
              <p>Loading calendar...</p>
            </div>
          ) : (
            <div className="h-[700px]">
              <FullCalendar
                ref={calendarRef}
                plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
                initialView="dayGridMonth"
                headerToolbar={{
                  left: 'prev,next today',
                  center: 'title',
                  right: 'dayGridMonth,timeGridWeek,timeGridDay',
                }}
                selectable={true}
                selectMirror={true}
                dayMaxEvents={true}
                weekends={true}
                events={events}
                select={handleDateSelect}
                eventClick={handleEventClick}
                height="100%"
                nowIndicator={true}
                slotMinTime="08:00:00"
                slotMaxTime="22:00:00"
                allDaySlot={true}
              />
            </div>
          )}
        </div>
      </div>

      {/* New Event Modal */}
      <Dialog open={showNewEventModal} onOpenChange={setShowNewEventModal}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>
              {selectedDates ? (
                <>
                  Add to{' '}
                  {new Date(selectedDates.start).toLocaleDateString(undefined, {
                    weekday: 'long',
                    month: 'long',
                    day: 'numeric',
                  })}
                </>
              ) : (
                'Add new event'
              )}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <RadioGroup
              value={newEventData.type}
              onValueChange={(value) =>
                handleTypeChange(
                  value as 'AVAILABLE' | 'UNAVAILABLE' | 'BOOKED'
                )
              }
              className="flex flex-col space-y-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="AVAILABLE" id="available" />
                <Label htmlFor="available" className="text-green-600">
                  Available
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="UNAVAILABLE" id="unavailable" />
                <Label htmlFor="unavailable" className="text-red-600">
                  Unavailable
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="BOOKED" id="booked" />
                <Label htmlFor="booked" className="text-blue-600">
                  Booked
                </Label>
              </div>
            </RadioGroup>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="title"
                name="title"
                value={newEventData.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
              />
            </div>

            {newEventData.type === 'BOOKED' && (
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name (optional)</Label>
                <Input
                  id="clientName"
                  name="clientName"
                  value={newEventData.clientName}
                  onChange={handleInputChange}
                  placeholder="Enter client name"
                />
                <p className="text-xs text-gray-500">
                  The client&apos;s name will not be displayed publicly.
                </p>
              </div>
            )}

            <div className="flex items-center space-x-2">
              <Checkbox
                id="isAllDay"
                checked={newEventData.isAllDay}
                onCheckedChange={handleAllDayChange}
              />
              <Label htmlFor="isAllDay">All-day event</Label>
            </div>

            {!newEventData.isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start">Start</Label>
                  <Input
                    id="start"
                    name="start"
                    type="datetime-local"
                    value={newEventData.start}
                    onChange={handleInputChange}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end">End</Label>
                  <Input
                    id="end"
                    name="end"
                    type="datetime-local"
                    value={newEventData.end}
                    onChange={handleInputChange}
                  />
                </div>
              </div>
            )}
            {newEventData.isAllDay && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date">Date</Label>
                  <Input
                    id="date"
                    name="start"
                    type="date"
                    value={newEventData.start.split('T')[0]}
                    onChange={(e) => {
                      setNewEventData({
                        ...newEventData,
                        start: `${e.target.value}T00:00`,
                        end: `${e.target.value}T23:59`,
                      });
                    }}
                  />
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowNewEventModal(false);
                resetEventForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateEvent}>
              {selectedDates
                ? `Add to ${new Date(selectedDates.start).toLocaleDateString(
                    undefined,
                    { month: 'short', day: 'numeric' }
                  )}`
                : 'Add Event'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Modal */}
      <Dialog open={showDeleteModal} onOpenChange={setShowDeleteModal}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Delete Event</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete the event &quot;
              {eventToDelete?.title}
              &quot;?
            </p>
            <p className="text-sm text-gray-500 mt-2">
              This action cannot be undone.
            </p>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowDeleteModal(false);
                setEventToDelete(null);
              }}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() =>
                eventToDelete && handleDeleteEvent(eventToDelete.id)
              }
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Recurring Events Modal */}
      <Dialog open={showRecurringModal} onOpenChange={setShowRecurringModal}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Create Recurring Events</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="recurringType">Event Type</Label>
              <RadioGroup
                value={newEventData.type}
                onValueChange={(value) =>
                  handleTypeChange(
                    value as 'AVAILABLE' | 'UNAVAILABLE' | 'BOOKED'
                  )
                }
                className="flex space-x-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="AVAILABLE" id="recurring-available" />
                  <Label
                    htmlFor="recurring-available"
                    className="text-green-600"
                  >
                    Available
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem
                    value="UNAVAILABLE"
                    id="recurring-unavailable"
                  />
                  <Label
                    htmlFor="recurring-unavailable"
                    className="text-red-600"
                  >
                    Unavailable
                  </Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="BOOKED" id="recurring-booked" />
                  <Label htmlFor="recurring-booked" className="text-blue-600">
                    Booked
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input
                id="recurring-title"
                name="title"
                value={newEventData.title}
                onChange={handleInputChange}
                placeholder="Enter event title"
              />
            </div>

            {newEventData.type === 'BOOKED' && (
              <div className="space-y-2">
                <Label htmlFor="clientName">Client Name (optional)</Label>
                <Input
                  id="recurring-clientName"
                  name="clientName"
                  value={newEventData.clientName}
                  onChange={handleInputChange}
                  placeholder="Enter client name"
                />
              </div>
            )}

            <div className="space-y-2">
              <Label htmlFor="frequency">Frequency</Label>
              <RadioGroup
                value={recurringOptions.frequency}
                onValueChange={(value) =>
                  setRecurringOptions({
                    ...recurringOptions,
                    frequency: value as 'daily' | 'weekly' | 'monthly',
                  })
                }
                className="flex space-x-4 pt-2"
              >
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="daily" id="daily" />
                  <Label htmlFor="daily">Daily</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="weekly" id="weekly" />
                  <Label htmlFor="weekly">Weekly</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="monthly" id="monthly" />
                  <Label htmlFor="monthly">Monthly</Label>
                </div>
              </RadioGroup>
            </div>

            {recurringOptions.frequency === 'weekly' && (
              <div className="space-y-2">
                <Label>Repeat on</Label>
                <div className="grid grid-cols-7 gap-2 pt-2">
                  {[
                    'Sunday',
                    'Monday',
                    'Tuesday',
                    'Wednesday',
                    'Thursday',
                    'Friday',
                    'Saturday',
                  ].map((day) => (
                    <div
                      key={day.toLowerCase()}
                      className="flex flex-col items-center"
                    >
                      <Checkbox
                        id={`day-${day.toLowerCase()}`}
                        checked={recurringOptions.days.includes(
                          day.toLowerCase()
                        )}
                        onCheckedChange={(checked) => {
                          const day_lower = day.toLowerCase();
                          if (checked) {
                            setRecurringOptions({
                              ...recurringOptions,
                              days: [...recurringOptions.days, day_lower],
                            });
                          } else {
                            setRecurringOptions({
                              ...recurringOptions,
                              days: recurringOptions.days.filter(
                                (d) => d !== day_lower
                              ),
                            });
                          }
                        }}
                      />
                      <Label
                        htmlFor={`day-${day.toLowerCase()}`}
                        className="text-xs mt-1"
                      >
                        {day.substring(0, 3)}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={recurringOptions.startDate}
                  onChange={(e) => {
                    setRecurringOptions({
                      ...recurringOptions,
                      startDate: e.target.value,
                    });
                  }}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={recurringOptions.endDate}
                  onChange={(e) => {
                    setRecurringOptions({
                      ...recurringOptions,
                      endDate: e.target.value,
                    });
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="occurrences">Maximum Occurrences</Label>
              <Input
                id="occurrences"
                type="number"
                min="1"
                max="30"
                value={recurringOptions.occurrences}
                onChange={(e) => {
                  setRecurringOptions({
                    ...recurringOptions,
                    occurrences: parseInt(e.target.value) || 4,
                  });
                }}
              />
              <p className="text-xs text-gray-500">
                Limit the number of events that will be created (max 30)
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowRecurringModal(false);
                resetEventForm();
              }}
            >
              Cancel
            </Button>
            <Button onClick={handleCreateRecurringEvents}>
              Create Recurring Events
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
