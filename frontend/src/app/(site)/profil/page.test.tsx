import { render, screen, waitFor } from "@testing-library/react";
import ProfilePage from "./page";
import { getCurrentUser } from "@/lib/user-api";
import { getAuthToken } from "@/lib/auth";

const replace = jest.fn();
const push = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    push,
    refresh,
  }),
}));

jest.mock("@/lib/auth", () => ({
  clearAuthToken: jest.fn(),
  getAuthToken: jest.fn(),
}));

jest.mock("@/lib/user-api", () => ({
  getCurrentUser: jest.fn(),
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthToken as jest.Mock).mockReturnValue("token");
  });

  it("renders phone and falls back to 'Aucun' for empty optional fields without showing the role", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: 1,
      lastname: "Martin",
      firstname: "Alex",
      email: "alex@example.com",
      dateOfBirth: "1992-01-01",
      pseudo: "",
      phone: null,
      role: "ROLE_ADMIN",
      canSeePrivate: true,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Mon profil")).toBeInTheDocument();
    });

    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Martin")).toBeInTheDocument();
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    expect(screen.getByText("Téléphone")).toBeInTheDocument();
    expect(screen.getAllByText("Aucun")).toHaveLength(2);
    expect(screen.queryByText("Rôle")).not.toBeInTheDocument();
    expect(screen.queryByText("ROLE_ADMIN")).not.toBeInTheDocument();
  });
});
