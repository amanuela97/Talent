'use client';

import { useSession } from 'next-auth/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import axiosInstance from '@/app/utils/axios';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  CheckCircle,
  XCircle,
  PhoneCall,
  MapPin,
  Briefcase,
  Tags,
  User,
  Loader2,
} from 'lucide-react';
import Loader from '@/components/custom/Loader';
import { toast } from 'sonner';

interface Talent {
  talentId: string;
  firsName: string;
  lastName: string;
  generalCategory: string;
  specificCategory: string;
  ServiceName: string;
  address: string;
  phoneNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
}

export default function TalentApprovalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [pendingTalents, setPendingTalents] = useState<Talent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processing, setProcessing] = useState<string | null>(null);

  // Check if user is authenticated and is an admin
  useEffect(() => {
    if (status === 'authenticated') {
      if (session?.user?.role !== 'ADMIN') {
        toast.info('You do not have permission to view this page.');
        router.push('/dashboard');
      } else {
        fetchPendingTalents();
      }
    } else if (status === 'unauthenticated') {
      router.push('/login');
    }
  }, [status, session, router]);

  const fetchPendingTalents = async () => {
    try {
      setIsLoading(true);
      const response = await axiosInstance.get('/talents/admin/pending');

      // Handle different possible response formats
      let talents: Talent[] = [];

      if (response.data) {
        if (Array.isArray(response.data)) {
          talents = response.data;
        } else if (
          response.data.talents &&
          Array.isArray(response.data.talents)
        ) {
          talents = response.data.talents;
        } else if (typeof response.data === 'object') {
          // Log the structure to help debug
          console.log('Response data structure:', Object.keys(response.data));

          // Try to find an array property in the response
          const possibleArrayProps = Object.keys(response.data).filter((key) =>
            Array.isArray(response.data[key])
          );

          if (possibleArrayProps.length > 0) {
            talents = response.data[possibleArrayProps[0]];
          } else {
            // If we can't find an array, create an empty one and show an error
            toast.error('Unexpected API response format');
          }
        }
      }

      console.log('Parsed talents:', talents);
      setPendingTalents(talents);
    } catch (error) {
      console.error('Error fetching pending talents:', error);
      toast.error('Failed to fetch pending talents.');
    } finally {
      setIsLoading(false);
    }
  };

  const updateTalentStatus = async (
    talentId: string,
    newStatus: 'APPROVED' | 'REJECTED'
  ) => {
    try {
      setProcessing(talentId);
      await axiosInstance.patch(`/talents/${talentId}/status`, {
        status: newStatus,
      });

      // Remove the talent from the list
      setPendingTalents((prevTalents) =>
        prevTalents.filter((talent) => talent.talentId !== talentId)
      );

      toast.success(`Talent has been ${newStatus.toLowerCase()}.`);
    } catch (error) {
      console.error(`Error ${newStatus.toLowerCase()} talent:`, error);
      toast.error(`Failed to ${newStatus.toLowerCase()} talent.`);
    } finally {
      setProcessing(null);
    }
  };

  if (isLoading || status === 'loading') {
    return <Loader />;
  }

  if (!session || session.user?.role !== 'ADMIN') {
    return <Loader />; // This will be redirected by the useEffect
  }

  // Ensure pendingTalents is an array before rendering
  const talentsToRender = Array.isArray(pendingTalents) ? pendingTalents : [];

  return (
    <div className="container max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
      <div className="mb-10 text-center">
        <h1 className="text-3xl font-bold mb-3">Talent Approval Dashboard</h1>
        <p className="text-muted-foreground max-w-2xl mx-auto">
          Review and approve or reject pending talent applications.
        </p>
      </div>

      {talentsToRender.length === 0 ? (
        <div className="text-center py-20 bg-muted/30 rounded-lg max-w-3xl mx-auto">
          <div className="mb-4 flex justify-center">
            <CheckCircle className="h-12 w-12 text-green-500 opacity-70" />
          </div>
          <p className="text-xl text-muted-foreground mb-2">
            No pending talent applications to review.
          </p>
          <p className="text-sm text-muted-foreground">
            All applications have been processed. Check back later for new
            submissions.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {talentsToRender.map((talent) => (
            <Card
              key={talent.talentId}
              className="overflow-hidden hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex justify-between items-start">
                  <div>
                    <CardTitle className="text-xl">
                      {talent.firsName} {talent.lastName}
                    </CardTitle>
                    <CardDescription className="flex items-center mt-1">
                      <User className="w-4 h-4 mr-1" />
                      <span>
                        Talent ID: {talent.talentId.substring(0, 8)}...
                      </span>
                    </CardDescription>
                  </div>
                  <Badge
                    variant="outline"
                    className="bg-amber-100 text-amber-800 border-amber-200 px-3 py-1"
                  >
                    Pending
                  </Badge>
                </div>
              </CardHeader>

              <CardContent className="space-y-4 pb-3">
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center">
                      <Briefcase className="w-4 h-4 mr-1.5" />
                      General Category
                    </p>
                    <p className="text-sm mt-1">{talent.generalCategory}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-muted-foreground flex items-center">
                      <Tags className="w-4 h-4 mr-1.5" />
                      Specific Category
                    </p>
                    <p className="text-sm mt-1">{talent.specificCategory}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Service Name
                  </p>
                  <p className="text-sm mt-1">{talent.ServiceName}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center">
                    <MapPin className="w-4 h-4 mr-1.5" />
                    Address
                  </p>
                  <p className="text-sm mt-1">{talent.address}</p>
                </div>

                <div>
                  <p className="text-sm font-medium text-muted-foreground flex items-center">
                    <PhoneCall className="w-4 h-4 mr-1.5" />
                    Phone Number
                  </p>
                  <p className="text-sm mt-1">{talent.phoneNumber}</p>
                </div>
              </CardContent>

              <CardFooter className="flex justify-between pt-2 gap-4 px-6 pb-6">
                <Button
                  variant="outline"
                  className="border-red-200 text-red-700 hover:bg-red-50 hover:text-red-800 flex-1 cursor-pointer"
                  onClick={() =>
                    updateTalentStatus(talent.talentId, 'REJECTED')
                  }
                  disabled={!!processing}
                >
                  {processing === talent.talentId ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <XCircle className="w-4 h-4 mr-2" />
                  )}
                  {processing === talent.talentId ? 'Processing...' : 'Reject'}
                </Button>

                <Button
                  variant="outline"
                  className="border-green-200 text-green-700 hover:bg-green-50 hover:text-green-800 flex-1 cursor-pointer"
                  onClick={() =>
                    updateTalentStatus(talent.talentId, 'APPROVED')
                  }
                  disabled={!!processing}
                >
                  {processing === talent.talentId ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4 mr-2" />
                  )}
                  {processing === talent.talentId ? 'Processing...' : 'Approve'}
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
