import { PageHeader } from "@/components/ui/page-header";
import { Banner } from "@/components/ui/banner";
import { TextLink } from "@/components/ui/text-link";

export function MentorProjectsUnavailable({loadFailed=false}:{loadFailed?:boolean}) {
  return <div className="space-y-6">
    <PageHeader title={loadFailed?"Could not verify Projects access":"Projects is turned off for your college"}
      description={loadFailed?"The LMS could not check your college module settings. This does not mean Projects is disabled.":"Projects is currently unavailable for your account. Contact your administrator if you need access."} />
    <Banner tone={loadFailed?"error":"warning"}
      action={<div className="flex flex-wrap items-center gap-3">
        {loadFailed?<TextLink href="/mentor/projects?retry=1" className="inline-flex min-h-11 items-center">Retry access check</TextLink>:null}
        <TextLink href="/mentor/notifications" className="inline-flex min-h-11 items-center">View notifications</TextLink>
      </div>}>
      Notifications are still available.
    </Banner>
  </div>;
}
