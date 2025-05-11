import Image from 'next/image';

interface NavigationItem {
  label: string;
  href: string;
  active?: boolean;
  onClick?: () => void;
}

interface ProfileSidebarProps {
  name: string;
  profileImage: string;
  completionPercentage: number;
  incompleteMessage: string;
  navigationItems: NavigationItem[];
}

export default function ProfileSidebar({
  name,
  profileImage,
  completionPercentage,
  incompleteMessage,
  navigationItems,
}: ProfileSidebarProps) {
  return (
    <div className="w-full md:w-80 bg-white shadow-md">
      <div className="relative">
        <Image
          src={profileImage || '/placeholder.svg'}
          alt={`${name}'s profile`}
          width={320}
          height={320}
          priority
          className="w-full h-80 object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 bg-black bg-opacity-50 text-white p-4">
          <p className="font-semibold">
            Profile {completionPercentage}% Completed
          </p>
        </div>
      </div>

      <div className="p-6">
        <h2 className="text-2xl font-bold mb-2">{name}</h2>
        <p className="text-gray-700 mb-6">{incompleteMessage}</p>

        <nav className="space-y-2">
          {navigationItems.map((item, index) => (
            <button
              key={index}
              onClick={item.onClick}
              className={`block w-full text-left p-3 rounded-md cursor-pointer ${
                item.active ? 'bg-blue-50 text-blue-600' : 'hover:bg-gray-100 '
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>
      </div>
    </div>
  );
}
