import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import ProfilePage from "./page";
import {
  deleteCurrentUser,
  getCurrentUser,
  updateMyProfile,
} from "@/lib/user-api";
import { clearAuthToken, getAuthToken } from "@/lib/auth";

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
  deleteCurrentUser: jest.fn(),
  updateMyProfile: jest.fn(),
}));

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getAuthToken as jest.Mock).mockReturnValue("token");
  });

  it("renders phone and an empty emergency contact section without showing the role", async () => {
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
      emergencyContact: null,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Mon profil")).toBeInTheDocument();
    });

    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Martin")).toBeInTheDocument();
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();
    expect(screen.getByText("Téléphone")).toBeInTheDocument();
    expect(screen.getByText("Contact d'urgence")).toBeInTheDocument();
    expect(
      screen.getByText("Aucun contact d'urgence enregistré."),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Ajouter un contact d'urgence" }),
    ).toBeInTheDocument();
    expect(screen.getAllByText("Aucun")).toHaveLength(6);
    expect(screen.queryByText("Rôle")).not.toBeInTheDocument();
    expect(screen.queryByText("ROLE_ADMIN")).not.toBeInTheDocument();
  });

  it("renders an existing emergency contact in the profile", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: 1,
      lastname: "Martin",
      firstname: "Alex",
      email: "alex@example.com",
      dateOfBirth: "1992-01-01",
      pseudo: "alex92",
      phone: "0612345678",
      role: "ROLE_USER",
      canSeePrivate: false,
      emergencyContact: {
        lastname: "Martin",
        firstname: "Claire",
        email: "claire@example.com",
        phone: "0600000000",
      },
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Mon profil")).toBeInTheDocument();
    });

    expect(screen.getByText("Contact d'urgence")).toBeInTheDocument();
    expect(screen.getByText("Claire")).toBeInTheDocument();
    expect(screen.getByText("claire@example.com")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Modifier le contact d'urgence" }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Supprimer le contact d'urgence" }),
    ).toBeEnabled();
  });

  it("deletes emergency contact via dedicated button for adult users", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: 1,
      lastname: "Martin",
      firstname: "Alex",
      email: "alex@example.com",
      dateOfBirth: "1992-01-01",
      pseudo: "alex92",
      phone: "0612345678",
      role: "ROLE_USER",
      canSeePrivate: false,
      emergencyContact: {
        lastname: "Durand",
        firstname: "Paul",
        email: "paul@example.com",
        phone: "0600000000",
      },
    });
    (updateMyProfile as jest.Mock).mockResolvedValue({
      id: 1,
      lastname: "Martin",
      firstname: "Alex",
      email: "alex@example.com",
      dateOfBirth: "1992-01-01",
      pseudo: "alex92",
      phone: "0612345678",
      role: "ROLE_USER",
      canSeePrivate: false,
      emergencyContact: null,
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Mon profil")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Supprimer le contact d'urgence" }),
    );

    await waitFor(() => {
      expect(updateMyProfile).toHaveBeenCalledWith({
        firstname: "Alex",
        lastname: "Martin",
        dateOfBirth: "1992-01-01",
        pseudo: "alex92",
        phone: "0612345678",
        emergencyContact: null,
      });
    });
  });

  it("sends the current profile fields when adding an emergency contact", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: 1,
      lastname: "Martin",
      firstname: "Alex",
      email: "alex@example.com",
      dateOfBirth: "1992-01-01",
      pseudo: "alex92",
      phone: "0612345678",
      role: "ROLE_USER",
      canSeePrivate: false,
      emergencyContact: null,
    });
    (updateMyProfile as jest.Mock).mockResolvedValue({
      id: 1,
      lastname: "Martin",
      firstname: "Alex",
      email: "alex@example.com",
      dateOfBirth: "1992-01-01",
      pseudo: "alex92",
      phone: "0612345678",
      role: "ROLE_USER",
      canSeePrivate: false,
      emergencyContact: {
        lastname: "Durand",
        firstname: "Paul",
        email: "paul@example.com",
        phone: "0600000000",
      },
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Mon profil")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Ajouter un contact d'urgence" }),
    );
    const dialog = await screen.findByRole("dialog");
    const dialogScope = within(dialog);

    fireEvent.change(dialogScope.getByLabelText("Nom"), {
      target: { value: "Durand" },
    });
    fireEvent.change(dialogScope.getByLabelText("Prenom"), {
      target: { value: "Paul" },
    });
    fireEvent.change(dialogScope.getByLabelText("Email"), {
      target: { value: "paul@example.com" },
    });
    fireEvent.change(dialogScope.getByLabelText("Telephone"), {
      target: { value: "0600000000" },
    });
    fireEvent.click(dialogScope.getByRole("button", { name: "Enregistrer" }));

    await waitFor(() => {
      expect(updateMyProfile).toHaveBeenCalledWith({
        firstname: "Alex",
        lastname: "Martin",
        dateOfBirth: "1992-01-01",
        pseudo: "alex92",
        phone: "0612345678",
        emergencyContact: {
          lastname: "Durand",
          firstname: "Paul",
          email: "paul@example.com",
          phone: "0600000000",
        },
      });
    });
  });

  it("deletes the current account from the profile page", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: 1,
      lastname: "Martin",
      firstname: "Alex",
      email: "alex@example.com",
      dateOfBirth: "1992-01-01",
      pseudo: "alex92",
      phone: "0612345678",
      role: "ROLE_USER",
      canSeePrivate: false,
      emergencyContact: null,
    });
    (deleteCurrentUser as jest.Mock).mockResolvedValue(undefined);

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Mon profil")).toBeInTheDocument();
    });

    fireEvent.click(
      screen.getByRole("button", { name: "Supprimer mon compte" }),
    );
    const dialog = await screen.findByRole("dialog");
    fireEvent.click(
      within(dialog).getByRole("button", { name: "Supprimer mon compte" }),
    );

    await waitFor(() => {
      expect(deleteCurrentUser).toHaveBeenCalledTimes(1);
      expect(clearAuthToken).toHaveBeenCalledTimes(1);
      expect(replace).toHaveBeenCalledWith("/auth/login");
    });
  });

  it("prevents a minor from removing emergency contact", async () => {
    (getCurrentUser as jest.Mock).mockResolvedValue({
      id: 1,
      lastname: "Martin",
      firstname: "Alex",
      email: "alex@example.com",
      dateOfBirth: "2010-01-01",
      pseudo: "alex92",
      phone: "0612345678",
      role: "ROLE_USER",
      canSeePrivate: false,
      emergencyContact: {
        lastname: "Durand",
        firstname: "Paul",
        email: "paul@example.com",
        phone: "0600000000",
      },
    });

    render(<ProfilePage />);

    await waitFor(() => {
      expect(screen.getByText("Mon profil")).toBeInTheDocument();
    });

    expect(
      screen.getByRole("button", { name: "Supprimer le contact d'urgence" }),
    ).toBeDisabled();

    fireEvent.click(
      screen.getByRole("button", { name: "Modifier le contact d'urgence" }),
    );

    const dialog = await screen.findByRole("dialog");
    const dialogScope = within(dialog);

    fireEvent.change(dialogScope.getByLabelText("Nom"), {
      target: { value: "" },
    });
    fireEvent.change(dialogScope.getByLabelText("Prenom"), {
      target: { value: "" },
    });
    fireEvent.change(dialogScope.getByLabelText("Email"), {
      target: { value: "" },
    });
    fireEvent.change(dialogScope.getByLabelText("Telephone"), {
      target: { value: "" },
    });
    fireEvent.click(dialogScope.getByRole("button", { name: "Enregistrer" }));

    expect(updateMyProfile).not.toHaveBeenCalled();
    const errors = await screen.findAllByText(
      "Le contact d'urgence est obligatoire pour un mineur.",
    );
    expect(errors.length).toBeGreaterThan(0);
  });
});
