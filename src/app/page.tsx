import { redirect } from "next/navigation";

// No landing page — drop the visitor straight into the multiple-choice
// quiz. Brand wordmark still navigates here, which just redirects.
export default function Home() {
  redirect("/quiz");
}
