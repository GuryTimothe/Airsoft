import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import UserTable from "./UserTable";
import { type User } from "@/lib/user-api";

jest.mock("@/lib/user-api", () => ({
  getCurrentUser: jest.fn(),
  getUsers: jest.fn(),
}));

import { getCurrentUser, getUsers } from "@/lib/user-api";

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
  const referenceDateIso = "2026-07-08T00:00:00.000Z";

  function computeAge(dateOfBirth: string): number {
    const birthDate = new Date(dateOfBirth);
    const now = new Date(referenceDateIso);

    let age = now.getFullYear() - birthDate.getFullYear();
    const monthDiff = now.getMonth() - birthDate.getMonth();
    const dayDiff = now.getDate() - birthDate.getDate();

    if (monthDiff < 0 || (monthDiff === 0 && dayDiff < 0)) {
      age -= 1;
    }

    return age;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentUser as jest.Mock).mockResolvedValue({ role: "ROLE_USER" });
    // Simulate server-side filtering the way the real API would.
    (getUsers as jest.Mock).mockImplementation(
      async (
        _page?: number,
        filters?: {
          role?: string;
          canSeePrivate?: boolean;
          isMinor?: boolean;
          search?: string;
          searchBy?: "lastname" | "firstname";
        },
      ) => {
        const filtered = users.filter((user) => {
          if (filters?.role && user.role !== filters.role) {
            return false;
          }

          if (
            filters?.canSeePrivate !== undefined &&
            user.canSeePrivate !== filters.canSeePrivate
          ) {
            return false;
          }

          if (
            filters?.isMinor !== undefined &&
            computeAge(user.dateOfBirth) < 18 !== filters.isMinor
          ) {
            return false;
          }

          if (filters?.search) {
            const search = filters.search.toLowerCase();
            const searchTarget = filters.searchBy ?? "lastname";
            const matches = user[searchTarget].toLowerCase().includes(search);
            if (!matches) {
              return false;
            }
          }

          return true;
        });

        return { users: filtered, view: undefined };
      },
    );
  });

  it("renders users, highlights minors, and filters by role/private access", async () => {
    render(
      <UserTable initialUsers={users} referenceDateIso={referenceDateIso} />,
    );

    expect(screen.getByText("Alex Martin")).toBeInTheDocument();
    expect(screen.getByText("Lucas Durand")).toBeInTheDocument();
    expect(screen.getByText("Nina Roux")).toBeInTheDocument();
    expect(screen.getByText("16 ans")).toBeInTheDocument();
    expect(screen.getByText("34 ans")).toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Filtrer par role"), {
      target: { value: "ROLE_ADMIN" },
    });

    await waitFor(() => {
      expect(screen.getByText("Alex Martin")).toBeInTheDocument();
      expect(screen.queryByText("Lucas Durand")).not.toBeInTheDocument();
      expect(screen.queryByText("Nina Roux")).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Filtrer par role"), {
      target: { value: "all" },
    });

    fireEvent.change(screen.getByLabelText("Filtrer par acces prive"), {
      target: { value: "no" },
    });

    await waitFor(() => {
      expect(screen.getByText("Lucas Durand")).toBeInTheDocument();
      expect(screen.queryByText("Alex Martin")).not.toBeInTheDocument();
      expect(screen.queryByText("Nina Roux")).not.toBeInTheDocument();
    });
  });

  it("resets all filters when clicking the reset button", async () => {
    render(
      <UserTable initialUsers={users} referenceDateIso={referenceDateIso} />,
    );

    const resetButton = screen.getByRole("button", {
      name: "Reinitialiser les filtres",
    });
    expect(resetButton).toBeDisabled();

    fireEvent.change(screen.getByLabelText("Filtrer par role"), {
      target: { value: "ROLE_ADMIN" },
    });
    fireEvent.change(screen.getByLabelText("Filtrer par acces prive"), {
      target: { value: "no" },
    });
    fireEvent.change(screen.getByLabelText("Filtrer par age"), {
      target: { value: "minor" },
    });
    fireEvent.change(screen.getByLabelText("Rechercher par"), {
      target: { value: "firstname" },
    });

    await waitFor(() => {
      expect(resetButton).not.toBeDisabled();
    });

    fireEvent.click(resetButton);

    await waitFor(() => {
      expect(screen.getByLabelText("Filtrer par role")).toHaveValue("all");
      expect(screen.getByLabelText("Filtrer par acces prive")).toHaveValue(
        "all",
      );
      expect(screen.getByLabelText("Filtrer par age")).toHaveValue("all");
      expect(screen.getByLabelText("Rechercher par")).toHaveValue("lastname");
      expect(screen.getByText("Alex Martin")).toBeInTheDocument();
      expect(screen.getByText("Lucas Durand")).toBeInTheDocument();
      expect(screen.getByText("Nina Roux")).toBeInTheDocument();
    });

    expect(resetButton).toBeDisabled();
  });

  it("filters by age category (majeur/mineur)", async () => {
    render(
      <UserTable initialUsers={users} referenceDateIso={referenceDateIso} />,
    );

    fireEvent.change(screen.getByLabelText("Filtrer par age"), {
      target: { value: "minor" },
    });

    await waitFor(() => {
      expect(screen.getByText("Lucas Durand")).toBeInTheDocument();
      expect(screen.queryByText("Alex Martin")).not.toBeInTheDocument();
      expect(screen.queryByText("Nina Roux")).not.toBeInTheDocument();
      expect(screen.queryByText("Sonia Boss")).not.toBeInTheDocument();
    });

    fireEvent.change(screen.getByLabelText("Filtrer par age"), {
      target: { value: "adult" },
    });

    await waitFor(() => {
      expect(screen.getByText("Alex Martin")).toBeInTheDocument();
      expect(screen.getByText("Nina Roux")).toBeInTheDocument();
      expect(screen.getByText("Sonia Boss")).toBeInTheDocument();
      expect(screen.queryByText("Lucas Durand")).not.toBeInTheDocument();
    });
  });

  it("searches by firstname or lastname (debounced)", async () => {
    render(
      <UserTable initialUsers={users} referenceDateIso={referenceDateIso} />,
    );

    fireEvent.change(screen.getByLabelText("Rechercher"), {
      target: { value: "roux" },
    });

    await waitFor(
      () => {
        expect(screen.getByText("Nina Roux")).toBeInTheDocument();
        expect(screen.queryByText("Alex Martin")).not.toBeInTheDocument();
        expect(screen.queryByText("Lucas Durand")).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );

    fireEvent.change(screen.getByLabelText("Rechercher par"), {
      target: { value: "firstname" },
    });
    fireEvent.change(screen.getByLabelText("Rechercher"), {
      target: { value: "nina" },
    });

    await waitFor(
      () => {
        expect(screen.getByText("Nina Roux")).toBeInTheDocument();
        expect(screen.queryByText("Alex Martin")).not.toBeInTheDocument();
        expect(screen.queryByText("Lucas Durand")).not.toBeInTheDocument();
      },
      { timeout: 2000 },
    );
  });

  it("disables edit for admin actor on admin and super admin rows only", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ role: "ROLE_ADMIN" });

    render(
      <UserTable initialUsers={users} referenceDateIso={referenceDateIso} />,
    );

    const adminRow = screen.getByText("Alex Martin").closest("tr");
    const superAdminRow = screen.getByText("Sonia Boss").closest("tr");
    const organizerRow = screen.getByText("Nina Roux").closest("tr");
    const userRow = screen.getByText("Lucas Durand").closest("tr");

    expect(adminRow).not.toBeNull();
    expect(superAdminRow).not.toBeNull();
    expect(organizerRow).not.toBeNull();
    expect(userRow).not.toBeNull();

    await waitFor(() => {
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
    });
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
