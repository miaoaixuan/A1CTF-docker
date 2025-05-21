import { redirect } from "react-router";

export function loader() {
    return redirect("/404");
}

export default function NotFound() {
    return null;
} 