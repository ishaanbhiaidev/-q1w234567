import { InviteHandler } from "@/components/invite-handler"

interface InvitePageProps {
  params: {
    id: string
  }
}

export default function InvitePage({ params }: InvitePageProps) {
  return <InviteHandler inviteId={params.id} />
}
