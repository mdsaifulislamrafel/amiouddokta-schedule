import JobEditor from "@/components/JobEditor";
export default function EditJob({ params }: { params: { id: string } }) { return <JobEditor id={params.id} />; }
