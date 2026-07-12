import { fireEvent, render, screen, within } from "@testing-library/react";
import UserTable from "./UserTable";
import { type User } from "@/lib/user-api";

jest.mock("@/lib/auth", () => ({
  getAuthToken: jest.fn(),
  getRolesFromToken: jest.fn(),
}));

import { getAuthToken, getRolesFromToken } from "@/lib/auth";

const users: User[] = [
  {
    id: 1,
    lastname: "Martin",
    firstname: "Alex",
    email: "alex@example.com",
    dateOfBirth: "1992-01-01",
    role: "ROLE_ADMIN",
    canSeePrivate: true,
  },
  {
    id: 2,
    lastname: "Durand",
    firstname: "Lucas",
    email: "lucas@example.com",
    dateOfBirth: "2010-02-14",
    role: "ROLE_USER",
    canSeePrivate: false,
  },
  {
    id: 3,
    lastname: "Roux",
    firstname: "Nina",
    email: "nina@example.com",
    dateOfBirth: "1995-04-20",
    role: "ROLE_ORGANIZER",
    canSeePrivate: true,
  },
  {
    id: 4,
    lastname: "Boss",
    firstname: "Sonia",
    email: "sonia@example.com",
    dateOfBirth: "1988-07-11",
    role: "ROLE_SUPER_ADMIN",
    canSeePrivate: true,
  },
];

describe("UserTable", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthToken as jest.Mock).mockReturnValue(null);
    (getRolesFromToken as jest.Mock).mockReturnValue([]);
  });

  it("renders users, highlights minors, and filters by role/private access", () => {
    render(
      <UserTable
        initialUsers={users}
        referenceDateIso="2026-07-08T00:00:00.000Z"
      />,
    );

    expect(screen.getByText("Alex Martin")).toBeInTheDocument();
    expect(screen.getByText("Lucas Durand")).toBeInTheDocument();
    expect(screen.getByText("Nina Roux")).toBeInTheDocument();
    expect(screen.getByText("16 ans")).toBeInTheDocument();
    expect(screen.getByText("34 ans")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrer par role"), {
      target: { value: "ROLE_ADMIN" },
    });

    expect(screen.getByText("Alex Martin")).toBeInTheDocument();
    expect(screen.queryByText("Lucas Durand")).not.toBeInTheDocument();
    expect(screen.queryByText("Nina Roux")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrer par role"), {
      target: { value: "all" },
    });

    fireEvent.change(screen.getByLabelText("Filtrer par acces prive"), {
      target: { value: "no" },
    });

    expect(screen.getByText("Lucas Durand")).toBeInTheDocument();
    expect(screen.queryByText("Alex Martin")).not.toBeInTheDocument();
    expect(screen.queryByText("Nina Roux")).not.toBeInTheDocument();
  });

  it("disables edit for admin actor on admin and super admin rows only", () => {
    (getAuthToken as jest.Mock).mockReturnValue("token");
    (getRolesFromToken as jest.Mock).mockReturnValue(["ROLE_ADMIN"]);

    render(
      <UserTable
        initialUsers={users}
        referenceDateIso="2026-07-08T00:00:00.000Z"
      />,
    );

    const adminRow = screen.getByText("Alex Martin").closest("tr");
    const superAdminRow = screen.getByText("Sonia Boss").closest("tr");
    const organizerRow = screen.getByText("Nina Roux").closest("tr");
    const userRow = screen.getByText("Lucas Durand").closest("tr");

    expect(adminRow).not.toBeNull();
    expect(superAdminRow).not.toBeNull();
    expect(organizerRow).not.toBeNull();
    expect(userRow).not.toBeNull();

    expect(
      within(adminRow as HTMLElement).getByRole("button", {
        name: "Modifier",
      }),
    ).toBeDisabled();
    expect(
      within(superAdminRow as HTMLElement).getByRole("button", {
        name: "Modifier",
      }),
    ).toBeDisabled();
    expect(
      within(organizerRow as HTMLElement).getByRole("link", {
        name: "Modifier",
      }),
    ).toBeInTheDocument();
    expect(
      within(userRow as HTMLElement).getByRole("link", {
        name: "Modifier",
      }),
    ).toBeInTheDocument();
  });
});
