export const HistoryPage = () => {
    return (
      <div className="container mx-auto max-w-4xl py-12">
        <h1 className="text-3xl font-bold mb-6">Weekly Log History</h1>
        <p className="text-muted-foreground">
          This is where all your compiled weekly logs will be displayed. You'll be able to click on a week to view the full markdown entry.
        </p>
        {/* Logic to fetch and display logs will go here */}
      </div>
    );
  };