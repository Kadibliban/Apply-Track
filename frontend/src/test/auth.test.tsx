import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../App";
import { AuthProvider } from "../auth";
import { ToastProvider } from "../toast";

function renderApp(path = "/login") {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

const userData = {
  id: 7,
  name: "Taylor Green",
  email: "taylor@example.com",
  created_at: "2026-10-23T12:00:00Z",
};

describe("authentication flows", () => {
  it("logs in, loads the dashboard and clears the session on logout", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "test-token", token_type: "bearer" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(userData), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        total_applications: 0,
        applications_by_status: { APPLIED: 0, ASSESSMENT: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0, WITHDRAWN: 0 },
        total_interviews: 0,
        total_offers: 0,
        total_rejections: 0,
        upcoming_interviews: 0,
        overdue_follow_ups: 0,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));

    renderApp();
    await user.type(screen.getByLabelText("Email address"), "taylor@example.com");
    await user.type(screen.getByLabelText("Password"), "correct-horse-battery");
    await user.click(screen.getByRole("button", { name: "Sign in" }));

    expect(await screen.findByRole("heading", { name: /Your next chapter is/ })).toBeInTheDocument();
    expect(await screen.findByText("Taylor Green")).toBeInTheDocument();
    expect(sessionStorage.getItem("applytrack.accessToken")).toBe("test-token");

    await user.click(screen.getByRole("button", { name: "Log out" }));
    expect(await screen.findByRole("heading", { name: "Good to see you again." })).toBeInTheDocument();
    expect(sessionStorage.getItem("applytrack.accessToken")).toBeNull();
  });

  it("registers an account and starts an authenticated session", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify(userData), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ access_token: "new-token", token_type: "bearer" }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify(userData), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({
        total_applications: 0,
        applications_by_status: { APPLIED: 0, ASSESSMENT: 0, INTERVIEW: 0, OFFER: 0, REJECTED: 0, WITHDRAWN: 0 },
        total_interviews: 0, total_offers: 0, total_rejections: 0, upcoming_interviews: 0, overdue_follow_ups: 0,
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }));
    renderApp("/register");
    expect(screen.getByRole("heading", { name: "Start with a little clarity." })).toBeInTheDocument();
    expect(screen.getByLabelText("Password")).toHaveAttribute("minLength", "12");
    await user.type(screen.getByLabelText("Your name"), "Taylor Green");
    await user.type(screen.getByLabelText("Email address"), "taylor@example.com");
    await user.type(screen.getByLabelText("Password"), "secure-password-123");
    await user.click(screen.getByRole("button", { name: "Create my account" }));
    expect(await screen.findByRole("heading", { name: /Your next chapter is/ })).toBeInTheDocument();
    expect(sessionStorage.getItem("applytrack.accessToken")).toBe("new-token");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(6));
  });
});
