import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function LoggedOutPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full text-center space-y-6">
        {/* Icon */}
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-4xl">👋</span>
          </div>
        </div>

        {/* Title */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-foreground">
            You've been logged out
          </h1>
          <p className="text-muted text-lg">
            Thanks for using FamilyPlate!
          </p>
        </div>

        {/* Description */}
        <p className="text-muted-foreground">
          Your session has been successfully ended. We hope to see you again soon!
        </p>

        {/* Actions */}
        <div className="space-y-3 pt-4">
          <Link href="/auth/login" className="block">
            <Button className="w-full" size="lg">
              Log back in
            </Button>
          </Link>
          
          <Link href="/" className="block">
            <Button variant="outline" className="w-full" size="lg">
              Go to home page
            </Button>
          </Link>
        </div>

        {/* Footer Note */}
        <p className="text-sm text-muted-foreground pt-6">
          Need help? <Link href="/support" className="text-primary hover:underline">Contact support</Link>
        </p>
      </div>
    </div>
  );
}
