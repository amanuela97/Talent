import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import axios from '@/app/utils/axios';

interface User {
  userId: string;
  name: string;
  profilePicture: string | null;
}

interface NewConversationProps {
  onClose: () => void;
  onCreate: (
    participantIds: string[],
    name?: string,
    isGroup?: boolean
  ) => Promise<void>;
}

const USERS_API_URL = process.env.REACT_APP_API_URL || 'http://localhost:4000';

const NewConversation: React.FC<NewConversationProps> = ({
  onClose,
  onCreate,
}) => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [conversationName, setConversationName] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch users on component mount
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const response = await axios.get(`${USERS_API_URL}/users`);

        // Filter out current user
        const currentUserId = getCurrentUserId();
        const filteredUsers = response.data.filter(
          (user: User) => user.userId !== currentUserId
        );

        setUsers(filteredUsers);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching users:', error);
        setError('Failed to load users. Please try again.');
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  // Helper function to get current user ID
  const getCurrentUserId = () => {
    const userData = localStorage.getItem('userData');
    if (userData) {
      const parsed = JSON.parse(userData);
      return parsed.userId;
    }
    return null;
  };

  // Filter users based on search query
  const filteredUsers = users.filter((user) =>
    user.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleUserSelect = (user: User) => {
    // Toggle selection
    if (selectedUsers.some((u) => u.userId === user.userId)) {
      setSelectedUsers(selectedUsers.filter((u) => u.userId !== user.userId));
    } else {
      setSelectedUsers([...selectedUsers, user]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedUsers.length === 0) {
      setError('Please select at least one user');
      return;
    }

    setIsSubmitting(true);

    try {
      const participantIds = selectedUsers.map((user) => user.userId);
      const isGroup = selectedUsers.length > 1;
      const name = isGroup && conversationName ? conversationName : undefined;

      await onCreate(participantIds, name, isGroup);
    } catch (error) {
      console.error('Error creating conversation:', error);
      setError('Failed to create conversation. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold">New Conversation</h2>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="p-4">
            {selectedUsers.length > 1 && (
              <div className="mb-4">
                <label
                  htmlFor="conversationName"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Group Name (optional)
                </label>
                <input
                  type="text"
                  id="conversationName"
                  value={conversationName}
                  onChange={(e) => setConversationName(e.target.value)}
                  className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Enter group name"
                />
              </div>
            )}

            <div className="mb-4">
              <label
                htmlFor="searchUsers"
                className="block text-sm font-medium text-gray-700 mb-1"
              >
                Search Users
              </label>
              <input
                type="text"
                id="searchUsers"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full border border-gray-300 rounded-md py-2 px-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search by name"
              />
            </div>

            {selectedUsers.length > 0 && (
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Selected ({selectedUsers.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedUsers.map((user) => (
                    <div
                      key={user.userId}
                      className="bg-blue-100 text-blue-800 rounded-full px-3 py-1 text-sm flex items-center"
                    >
                      <span>{user.name}</span>
                      <button
                        type="button"
                        onClick={() => handleUserSelect(user)}
                        className="ml-2 text-blue-500 hover:text-blue-700"
                      >
                        &times;
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {error && <div className="mb-4 text-red-500 text-sm">{error}</div>}

            <div className="max-h-60 overflow-y-auto border border-gray-300 rounded-md">
              {loading ? (
                <div className="p-4 text-center text-gray-500">
                  Loading users...
                </div>
              ) : filteredUsers.length === 0 ? (
                <div className="p-4 text-center text-gray-500">
                  No users found
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <li
                      key={user.userId}
                      onClick={() => handleUserSelect(user)}
                      className={`p-3 flex items-center cursor-pointer hover:bg-gray-50 ${
                        selectedUsers.some((u) => u.userId === user.userId)
                          ? 'bg-blue-50'
                          : ''
                      }`}
                    >
                      <div className="flex-shrink-0 h-10 w-10 rounded-full overflow-hidden mr-3">
                        <Image
                          src={user.profilePicture || '/default-avatar.png'}
                          alt={user.name}
                          width={40}
                          className="h-full w-full object-cover"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src =
                              '/default-avatar.png';
                          }}
                        />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-sm font-medium">{user.name}</h3>
                      </div>
                      {selectedUsers.some((u) => u.userId === user.userId) && (
                        <div className="flex-shrink-0 text-blue-500">
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className="h-5 w-5"
                            viewBox="0 0 20 20"
                            fill="currentColor"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-gray-200 flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={`px-4 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isSubmitting || selectedUsers.length === 0
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-blue-500 text-white hover:bg-blue-600'
              }`}
              disabled={isSubmitting || selectedUsers.length === 0}
            >
              {isSubmitting ? 'Creating...' : 'Start Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewConversation;
