export interface BookingRequestData {
  talentName: string;
  clientName: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  duration: number;
  location: string;
  totalPrice: number;
}

export interface BookingConfirmationData {
  clientName: string;
  talentName: string;
  serviceName: string;
  eventType: string;
  eventDate: string;
  eventTime: string;
  duration: number;
  location: string;
  totalPrice: number;
}

export interface BookingStatusUpdateData {
  clientName: string;
  talentName: string;
  serviceName: string;
  eventType: string;
  eventDate: string;
  eventTime?: string;
  duration?: number;
  location?: string;
}
