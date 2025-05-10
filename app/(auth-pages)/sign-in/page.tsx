import { signInAction } from "@/app/actions";
import { FormMessage, Message } from "@/components/form-message";
import { SubmitButton } from "@/components/submit-button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";

export default async function Login(props: { searchParams: Promise<Message> }) {
  const searchParams = await props.searchParams;
  
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-muted p-4">
      <Card className="w-full max-w-md p-8 shadow-lg">
        <div className="flex flex-col items-center mb-8">
          <h1 className="text-3xl font-bold text-center bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            Welcome Back
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            Don't have an account?{" "}
            <Link 
              className="text-primary font-medium hover:text-primary/80 transition-colors" 
              href="/sign-up"
            >
              Sign up
            </Link>
          </p>
        </div>

        <form className="flex-1 flex flex-col gap-6">
          <div className="space-y-4">
            <div className="relative">
              <Label htmlFor="email" className="text-sm font-medium block mb-1.5">
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input 
                  name="email" 
                  id="email"
                  placeholder="you@example.com" 
                  required 
                  className="pl-10 transition-shadow duration-200 hover:shadow-sm focus:shadow-md"
                />
              </div>
            </div>

            <div className="relative">
              <div className="flex justify-between items-center mb-1.5">
                <Label htmlFor="password" className="text-sm font-medium">
                  Password
                </Label>
                <Link
                  className="text-xs text-muted-foreground hover:text-primary transition-colors"
                  href="/forgot-password"
                >
                  Forgot Password?
                </Link>
              </div>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="password"
                  name="password"
                  id="password"
                  placeholder="••••••••"
                  required
                  className="pl-10 transition-shadow duration-200 hover:shadow-sm focus:shadow-md"
                />
              </div>
            </div>
          </div>

          <SubmitButton 
            pendingText="Signing In..." 
            formAction={signInAction}
            className="w-full bg-primary hover:bg-primary/90 text-primary-foreground transition-all duration-200 py-2.5 rounded-lg font-medium shadow-sm hover:shadow-md"
          >
            Sign in
          </SubmitButton>

          <FormMessage message={searchParams} />
        </form>
      </Card>
    </div>
  );
}