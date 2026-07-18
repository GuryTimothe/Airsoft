import { render, screen } from "@testing-library/react";
import { UserDetail } from "./user-detail";

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

jest.mock("@/lib/user-api", () => ({
  getUser: jest.fn(),
  deleteUser: jest.fn(),
  getCurrentUser: jest.fn(),
}));

import { getCurrentUser, getUser } from "@/lib/user-api";

describe("UserDetail", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getCurrentUser as jest.Mock).mockResolvedValue({ role: "ROLE_USER" });
  });

  it("renders emergency contact card when a contact exists", async () => {
    (getUser as jest.Mock).mockResolvedValue({
      id: 3,
      firstname: "Enfant",
      lastname: "MMineur",
      email: "enfant@example.com",
      dateOfBirth: "2010-05-15",
      role: "ROLE_USER",
      canSeePrivate: false,
      pseudo: null,
      phone: null,
      emergencyContact: {
        lastname: "Micheline",
        firstname: "Michel",
        email: "testmail2@mail.comm",
        phone: "0123456789",
      },
    });

    render(<UserDetail userId={3} />);

    expect(await screen.findByText("Contact d'urgence")).toBeInTheDocument();
    expect(screen.getByText("Micheline")).toBeInTheDocument();
    expect(screen.getByText("Michel")).toBeInTheDocument();
    expect(screen.getByText("testmail2@mail.comm")).toBeInTheDocument();
    expect(screen.getByText("0123456789")).toBeInTheDocument();
  });

  it("does not render emergency contact card when no contact exists", async () => {
    (getUser as jest.Mock).mockResolvedValue({
      id: 1,
      firstname: "Hadd",
      lastname: "Mine",
      email: "hadd@example.com",
      dateOfBirth: "1990-02-14",
      role: "ROLE_USER",
      canSeePrivate: false,
      pseudo: null,
      phone: null,
    });

    render(<UserDetail userId={1} />);

    expect(
      await screen.findByText("Informations principales"),
    ).toBeInTheDocument();
    expect(screen.queryByText("Contact d'urgence")).not.toBeInTheDocument();
  });

  it("keeps page usable and falls back to user emergency contact when lookup fails", async () => {
    (getUser as jest.Mock).mockResolvedValue({
      id: 7,
      firstname: "Lina",
      lastname: "Durand",
      email: "lina@example.com",
      dateOfBirth: "2008-09-02",
      role: "ROLE_USER",
      canSeePrivate: false,
      pseudo: null,
      phone: null,
      emergencyContact: {
        lastname: "Durand",
        firstname: "Marc",
        email: "marc@example.com",
        phone: "0600000000",
      },
    });

    render(<UserDetail userId={7} />);

    expect(
      await screen.findByText("Informations principales"),
    ).toBeInTheDocument();
    expect(screen.getByText("Contact d'urgence")).toBeInTheDocument();
    expect(screen.getByText("marc@example.com")).toBeInTheDocument();
  });

  it("disables edit and delete actions for admin actor on elevated targets", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({ role: "ROLE_ADMIN" });
    (getUser as jest.Mock).mockResolvedValue({
      id: 11,
      firstname: "Ada",
      lastname: "Admin",
      email: "ada@example.com",
      dateOfBirth: "1990-01-01",
      role: "ROLE_SUPER_ADMIN",
      canSeePrivate: true,
      pseudo: null,
      phone: null,
    });

    render(<UserDetail userId={11} />);

    expect(
      await screen.findByText("Informations principales"),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Modifier" })).toBeDisabled();
    expect(screen.getByRole("button", { name: "Supprimer" })).toBeDisabled();
  });
});
