import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { ProfileContent } from "./profile-content";
import {
  deleteCurrentUser,
  getCurrentUser,
  updateMyPassword,
  updateMyProfile,
} from "@/lib/user-api";
import { clearAuthToken } from "@/lib/auth";

const replace = jest.fn();
const refresh = jest.fn();

jest.mock("next/navigation", () => ({
  useRouter: () => ({
    replace,
    refresh,
  }),
}));

jest.mock("@/lib/auth", () => ({
  clearAuthToken: jest.fn(),
}));

jest.mock("@/lib/user-api", () => ({
  getCurrentUser: jest.fn(),
  updateMyEmail: jest.fn(),
  updateMyPassword: jest.fn(),
  updateMyProfile: jest.fn(),
  deleteCurrentUser: jest.fn(),
}));

const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockedUpdateMyProfile = updateMyProfile as jest.MockedFunction<
  typeof updateMyProfile
>;
const mockedUpdateMyPassword = updateMyPassword as jest.MockedFunction<
  typeof updateMyPassword
>;
const mockedDeleteCurrentUser = deleteCurrentUser as jest.MockedFunction<
  typeof deleteCurrentUser
>;
const mockedClearAuthToken = clearAuthToken as jest.MockedFunction<
  typeof clearAuthToken
>;

const baseUser = {
  id: 1,
  firstname: "Alex",
  lastname: "Martin",
  email: "alex@example.com",
  dateOfBirth: "1995-03-20T00:00:00+00:00",
  pseudo: null,
  phone: null,
  emergencyContact: null,
  role: "ROLE_USER" as const,
  canSeePrivate: false,
};

describe("ProfileContent", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCurrentUser.mockResolvedValue(baseUser);
  });

  it("loads and renders current user profile", async () => {
    render(<ProfileContent />);

    expect(screen.getByText("Chargement du profil...")).toBeInTheDocument();

    expect(
      await screen.findByRole("heading", { name: "Mon profil" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Alex")).toBeInTheDocument();
    expect(screen.getByText("Martin")).toBeInTheDocument();
    expect(screen.getByText("alex@example.com")).toBeInTheDocument();

    const fallbackValues = screen.getAllByText("Aucun");
    expect(fallbackValues.length).toBeGreaterThan(0);
  });

  it("shows load error when profile fetch fails", async () => {
    mockedGetCurrentUser.mockRejectedValueOnce(
      new Error("Impossible de charger votre profil."),
    );

    render(<ProfileContent />);

    expect(
      await screen.findByText("Impossible de charger votre profil."),
    ).toBeInTheDocument();
  });

  it("opens email modal", async () => {
    const user = userEvent.setup();
    render(<ProfileContent />);

    await screen.findByRole("heading", { name: "Mon profil" });

    await user.click(screen.getByRole("button", { name: "Modifier email" }));
    const emailDialog = await screen.findByRole("dialog", {
      name: "Modifier mon email",
    });
    expect(
      within(emailDialog).getByText(
        "La validation exige votre mot de passe actuel.",
      ),
    ).toBeInTheDocument();
    expect(
      within(emailDialog).getByLabelText("Nouvel email"),
    ).toBeInTheDocument();
    expect(
      within(emailDialog).getByLabelText("Mot de passe actuel"),
    ).toBeInTheDocument();
  });

  it("opens password modal", async () => {
    const user = userEvent.setup();
    render(<ProfileContent />);

    await screen.findByRole("heading", { name: "Mon profil" });

    await user.click(
      screen.getByRole("button", { name: "Modifier mot de passe" }),
    );
    const passwordDialog = await screen.findByRole("dialog", {
      name: "Modifier mon mot de passe",
    });

    expect(
      within(passwordDialog).getByLabelText("Mot de passe actuel"),
    ).toBeInTheDocument();
    expect(
      within(passwordDialog).getByLabelText("Nouveau mot de passe"),
    ).toBeInTheDocument();
    expect(
      within(passwordDialog).getByLabelText("Confirmation"),
    ).toBeInTheDocument();
    expect(
      within(passwordDialog).getByRole("link", {
        name: "Mot de passe oublié ?",
      }),
    ).toHaveAttribute("href", "/auth/forget-password?email=alex%40example.com");
  });

  it("keeps the user signed in after changing the password", async () => {
    const user = userEvent.setup();
    mockedUpdateMyPassword.mockResolvedValueOnce({
      user: baseUser,
      token: "renewed.jwt.token",
    });

    render(<ProfileContent />);

    await screen.findByRole("heading", { name: "Mon profil" });
    await user.click(
      screen.getByRole("button", { name: "Modifier mot de passe" }),
    );
    const passwordDialog = await screen.findByRole("dialog", {
      name: "Modifier mon mot de passe",
    });
    fireEvent.change(
      within(passwordDialog).getByLabelText("Mot de passe actuel"),
      { target: { value: "CurrentPassword123!" } },
    );
    fireEvent.change(
      within(passwordDialog).getByLabelText("Nouveau mot de passe"),
      { target: { value: "NewPassword123!" } },
    );
    fireEvent.change(within(passwordDialog).getByLabelText("Confirmation"), {
      target: { value: "NewPassword123!" },
    });
    fireEvent.click(
      within(passwordDialog).getByRole("button", { name: "Enregistrer" }),
    );

    await waitFor(() => {
      expect(mockedUpdateMyPassword).toHaveBeenCalledWith({
        currentPassword: "CurrentPassword123!",
        newPassword: "NewPassword123!",
      });
      expect(mockedClearAuthToken).not.toHaveBeenCalled();
      expect(replace).not.toHaveBeenCalled();
      expect(refresh).not.toHaveBeenCalled();
      expect(screen.getByText("Mot de passe mis a jour.")).toBeInTheDocument();
    });
  });

  it("deletes emergency contact for adult user", async () => {
    const user = userEvent.setup();
    mockedGetCurrentUser.mockResolvedValue({
      ...baseUser,
      emergencyContact: {
        lastname: "Durand",
        firstname: "Paul",
        email: "paul@example.com",
        phone: "0600000000",
      },
    });
    mockedUpdateMyProfile.mockResolvedValueOnce({
      ...baseUser,
      emergencyContact: null,
    });

    render(<ProfileContent />);

    await screen.findByRole("heading", { name: "Mon profil" });

    await user.click(
      screen.getByRole("button", {
        name: "Supprimer le contact d'urgence",
      }),
    );

    await waitFor(() => {
      expect(mockedUpdateMyProfile).toHaveBeenCalledWith(
        expect.objectContaining({ emergencyContact: null }),
      );
      expect(
        screen.getByText("Contact d'urgence supprime."),
      ).toBeInTheDocument();
    });
  });

  it("disables emergency-contact deletion for minor user", async () => {
    mockedGetCurrentUser.mockResolvedValue({
      ...baseUser,
      dateOfBirth: "2012-01-01T00:00:00+00:00",
      emergencyContact: {
        lastname: "Durand",
        firstname: "Paul",
        email: "paul@example.com",
        phone: "0600000000",
      },
    });

    render(<ProfileContent />);

    await screen.findByRole("heading", { name: "Mon profil" });

    expect(
      screen.getByRole("button", {
        name: "Supprimer le contact d'urgence",
      }),
    ).toBeDisabled();
  });

  it("deletes account and redirects to login", async () => {
    const user = userEvent.setup();
    mockedDeleteCurrentUser.mockResolvedValueOnce(undefined);

    render(<ProfileContent />);

    await screen.findByRole("heading", { name: "Mon profil" });

    await user.click(
      screen.getByRole("button", { name: "Supprimer mon compte" }),
    );

    const confirmButtons = await screen.findAllByRole("button", {
      name: "Supprimer mon compte",
    });
    fireEvent.click(confirmButtons[confirmButtons.length - 1]);

    await waitFor(() => {
      expect(mockedDeleteCurrentUser).toHaveBeenCalledTimes(1);
      expect(mockedClearAuthToken).toHaveBeenCalledTimes(1);
      expect(replace).toHaveBeenCalledWith("/auth/login");
      expect(refresh).toHaveBeenCalledTimes(1);
    });
  });
});
