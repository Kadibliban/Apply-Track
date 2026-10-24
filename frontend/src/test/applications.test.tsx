import { render, screen, waitFor, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { describe, expect, it, vi } from "vitest";
import App from "../App";
import { AuthProvider } from "../auth";
import { ToastProvider } from "../toast";
import type { Application } from "../types";

const existingApplication: Application = {
  id: 31,
  user_id: 7,
  company: "Northstar Studio",
  job_title: "Product Designer",
  job_url: null,
  location: "Remote",
  employment_type: "Full-time",
  salary_min: 80000,
  salary_max: 100000,
  application_date: "2026-10-22",
  status: "APPLIED",
  job_description: null,
  notes: "Met at the design meetup.",
  created_at: "2026-10-22T10:00:00Z",
  updated_at: "2026-10-22T10:00:00Z",
};

function renderApplications() {
  sessionStorage.setItem("applytrack.accessToken", "test-token");
  return render(
    <MemoryRouter initialEntries={["/applications"]}>
      <AuthProvider>
        <ToastProvider>
          <App />
        </ToastProvider>
      </AuthProvider>
    </MemoryRouter>,
  );
}

describe("applications workflow", () => {
  it("loads, searches, filters, and creates an application", async () => {
    const user = userEvent.setup();
    const fetchMock = vi.spyOn(globalThis, "fetch");
    fetchMock
      .mockResolvedValueOnce(new Response(JSON.stringify({
        id: 7,
        name: "Taylor Green",
        email: "taylor@example.com",
        created_at: "2026-10-23T12:00:00Z",
      }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([existingApplication]), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([existingApplication]), { status: 200 }))
      .mockResolvedValueOnce(new Response("[]", { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ ...existingApplication, id: 32, company: "New Company" }), { status: 201 }))
      .mockResolvedValueOnce(new Response(JSON.stringify([{ ...existingApplication, id: 32, company: "New Company" }]), { status: 200 }));

    renderApplications();
    expect(await screen.findByText("Northstar Studio")).toBeInTheDocument();

    await user.type(screen.getByRole("textbox", { name: "Search applications" }), "Northstar");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("search=Northstar"),
      expect.any(Object),
    ));
    await user.selectOptions(screen.getByLabelText("Filter by status"), "OFFER");
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("status=OFFER"),
      expect.any(Object),
    ));

    await user.click(screen.getByRole("button", { name: /Add application/ }));
    await user.type(screen.getByPlaceholderText("e.g. Northstar Studio"), "New Company");
    await user.type(screen.getByPlaceholderText("e.g. Product Designer"), "Researcher");
    await user.click(within(screen.getByRole("dialog")).getByRole("button", { name: "Add application" }));
    expect(await screen.findByText("Application added to your tracker.")).toBeInTheDocument();
    await waitFor(() => expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:8000/applications",
      expect.objectContaining({ method: "POST" }),
    ));
  });
});
