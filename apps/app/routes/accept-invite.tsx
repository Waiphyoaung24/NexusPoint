import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { z } from "zod";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  Button,
  Avatar,
  AvatarFallback,
} from "@repo/ui";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { api } from "@/lib/trpc";
import { getCachedSession, sessionQueryOptions } from "@/lib/queries/session";

const searchSchema = z.object({
  token: z.string(),
});

export const Route = createFileRoute("/accept-invite")({
  validateSearch: searchSchema,
  beforeLoad: async ({ context }) => {
    // We don't force login here, we want to show the invite details even if public
    let session = getCachedSession(context.queryClient);
    if (session === undefined) {
      session = await context.queryClient.fetchQuery(sessionQueryOptions());
    }
    return { session };
  },
  component: AcceptInvitePage,
});

function AcceptInvitePage() {
  const { token } = Route.useSearch();
  const { session } = Route.useRouteContext();
  const router = useRouter();
  const queryClient = useQueryClient();

  const {
    data: invite,
    isLoading,
    error,
  } = useQuery(api.organization.getInvite.queryOptions({ token }));

  const acceptMutation = useMutation(
    api.organization.acceptInvite.mutationOptions({
      onSuccess: async () => {
        await queryClient.invalidateQueries(sessionQueryOptions());
        router.navigate({ to: "/" });
      },
    }),
  );

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (error || !invite) {
    return (
      <div className="flex min-h-screen items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
              <AlertCircle className="h-6 w-6 text-destructive" />
            </div>
            <CardTitle>Invalid Invitation</CardTitle>
            <CardDescription>
              This invitation link is invalid, expired, or has already been
              used.
            </CardDescription>
          </CardHeader>
          <CardFooter className="justify-center">
            <Button onClick={() => router.navigate({ to: "/" })}>
              Return Home
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  const handleAccept = () => {
    acceptMutation.mutate({ token });
  };

  const handleLogin = () => {
    router.navigate({
      to: "/login",
      search: { returnTo: `/accept-invite?token=${token}` },
    });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-muted/40 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
            <CheckCircle2 className="h-6 w-6 text-primary" />
          </div>
          <CardTitle>You've been invited!</CardTitle>
          <CardDescription>
            <strong>{invite.inviterName || invite.inviterEmail}</strong> has
            invited you to join
          </CardDescription>
          <div className="mt-4 flex flex-col items-center gap-2">
            <Avatar className="h-16 w-16">
              <AvatarFallback className="text-lg">
                {invite.organizationName.substring(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <h3 className="text-xl font-bold">{invite.organizationName}</h3>
            <p className="text-sm text-muted-foreground capitalize">
              {invite.role} Role
            </p>
          </div>
        </CardHeader>
        <CardContent className="text-center text-sm text-muted-foreground">
          {session?.user ? (
            <p>
              Signed in as <strong>{session.user.email}</strong>
            </p>
          ) : (
            <p>Please log in to accept this invitation.</p>
          )}
        </CardContent>
        <CardFooter className="flex flex-col gap-2">
          {session?.user ? (
            <Button
              className="w-full"
              onClick={handleAccept}
              disabled={acceptMutation.isPending}
            >
              {acceptMutation.isPending ? "Joining..." : "Join Organization"}
            </Button>
          ) : (
            <div className="flex w-full flex-col gap-2">
              <Button className="w-full" onClick={handleLogin}>
                Log in to Accept
              </Button>
              <Button
                variant="outline"
                className="w-full"
                onClick={() =>
                  router.navigate({
                    to: "/signup",
                    search: { returnTo: `/accept-invite?token=${token}` },
                  })
                }
              >
                Create Account
              </Button>
            </div>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
