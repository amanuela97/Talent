import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface TalentSearchHeaderProps {
  onSearch: (query: string) => void;
  initialQuery?: string;
}

export default function TalentSearchHeader({
  onSearch,
  initialQuery = "",
}: TalentSearchHeaderProps) {
  return (
    <section className="bg-gradient-to-r from-orange-600 to-orange-500 text-white py-16">
      <div className="container mx-auto px-4">
        <h1 className="text-4xl font-bold mb-6 text-center">
          Discover Amazing Talent
        </h1>
        <p className="text-xl mb-8 text-center max-w-2xl mx-auto">
          Find the perfect performer for your next event, production, or project
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            onSearch(formData.get("search") as string);
          }}
          className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg p-2 flex"
        >
          <Input
            name="search"
            defaultValue={initialQuery}
            placeholder="Search by talent name, category, or service..."
            className="flex-grow border-none focus-visible:ring-0 focus-visible:ring-offset-0 text-gray-800"
          />
          <Button
            type="submit"
            className="ml-2 bg-orange-500 hover:bg-orange-600"
          >
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
        </form>
      </div>
    </section>
  );
}
