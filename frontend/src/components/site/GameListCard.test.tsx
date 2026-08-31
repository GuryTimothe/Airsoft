import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import { GameListCard } from "./GameListCard";
import { getGames } from "@/lib/game-api";
import {
  getMyGameRegistrations,
  registerToGame,
  cancelGameRegistration,
} from "@/lib/game-registration-api";
import { getCurrentUser } from "@/lib/user-api";
import { AUTH_STATE_CHANGE_EVENT } from "@/lib/auth";

jest.mock("@/lib/game-api", () => ({
  getGames: jest.fn(),
}));

jest.mock("@/lib/game-registration-api", () => ({
  getMyGameRegistrations: jest.fn(),
  registerToGame: jest.fn(),
  cancelGameRegistration: jest.fn(),
}));

jest.mock("@/lib/user-api", () => ({
  getCurrentUser: jest.fn(),
}));

jest.mock("@/assets/images/game-banner.jpg", () => ({
  src: "/game-banner.jpg",
}));

const mockedGetGames = getGames as jest.MockedFunction<typeof getGames>;
const mockedGetMyGameRegistrations =
  getMyGameRegistrations as jest.MockedFunction<typeof getMyGameRegistrations>;
const mockedGetCurrentUser = getCurrentUser as jest.MockedFunction<
  typeof getCurrentUser
>;
const mockedRegisterToGame = registerToGame as jest.MockedFunction<
  typeof registerToGame
>;
const mockedCancelGameRegistration =
  cancelGameRegistration as jest.MockedFunction<typeof cancelGameRegistration>;

describe("GameListCard", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockedGetCurrentUser.mockRejectedValue(new Error("unauthenticated"));
    mockedGetMyGameRegistrations.mockResolvedValue([]);
    mockedRegisterToGame.mockResolvedValue({
      id: 99,
      gameId: 1,
      userId: 1,
      userFirstname: "Jean",
      userLastname: "Dupont",
      userEmail: "jean@test.com",
      userAge: 30,
      isPresent: false,
      createdAt: new Date().toISOString(),
    });
    mockedCancelGameRegistration.mockResolvedValue(undefined);
    mockedGetGames.mockResolvedValue([
      {
        id: 1,
        title: "Forêt",
        description: "Partie en forêt",
        startDateTime: new Date(Date.now() + 86400000).toISOString(),
        address: "Domaine de la Forêt",
        price: 15,
        maxPlaces: 24,
        registrationCount: 0,
        availablePlaces: 24,
        full: false,
        isPublic: true,
      },
      {
        id: 2,
        title: "Privée",
        description: "Partie privée",
        startDateTime: new Date(Date.now() + 86400000).toISOString(),
        address: "Base secrète",
        price: 18,
        maxPlaces: 20,
        registrationCount: 0,
        availablePlaces: 20,
        full: false,
        isPublic: false,
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders upcoming games (including private) and shows the static banner", async () => {
    const { container } = render(<GameListCard />);

    expect(screen.getByText("Chargement des parties…")).toBeInTheDocument();
    expect(await screen.findByText("Forêt")).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { name: "Privée", level: 3 }),
    ).toBeInTheDocument();

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(2);

    const banner = container.querySelector('[data-testid="game-banner"]');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveStyle("background-image: url(/game-banner.jpg)");
  });

  it("keeps games visible when registration lookup fails for a connected user", async () => {
    mockedGetCurrentUser.mockResolvedValue({ role: "ROLE_USER" } as never);
    mockedGetMyGameRegistrations.mockRejectedValueOnce(
      new Error("Impossible de charger vos inscriptions."),
    );

    render(<GameListCard />);

    expect(await screen.findByText("Forêt")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "S'inscrire à Forêt" }),
    ).toBeInTheDocument();
    expect(
      screen.queryByText("Impossible de charger vos inscriptions."),
    ).not.toBeInTheDocument();
  });

  it("keeps the registration button enabled for admins even when the game is full", async () => {
    mockedGetCurrentUser.mockResolvedValue({ role: "ROLE_ADMIN" } as never);
    mockedGetGames.mockResolvedValueOnce([
      {
        id: 1,
        title: "Forêt",
        description: "Partie en forêt",
        startDateTime: new Date(Date.now() + 86400000).toISOString(),
        address: "Domaine de la Forêt",
        price: 15,
        maxPlaces: 24,
        registrationCount: 24,
        availablePlaces: 0,
        full: true,
        isPublic: true,
      },
    ]);

    render(<GameListCard />);

    expect(await screen.findByText("Forêt")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "S'inscrire à Forêt" }),
    ).toHaveTextContent("S'inscrire malgré complet");
    expect(
      screen.getByRole("button", { name: "S'inscrire à Forêt" }),
    ).toBeEnabled();
  });

  it("shows 'Complet' disabled button for regular user when game is full", async () => {
    mockedGetCurrentUser.mockResolvedValue({ role: "ROLE_USER" } as never);
    mockedGetGames.mockResolvedValueOnce([
      {
        id: 1,
        title: "Forêt",
        description: "Partie en forêt",
        startDateTime: new Date(Date.now() + 86400000).toISOString(),
        address: "Domaine de la Forêt",
        price: 15,
        maxPlaces: 5,
        registrationCount: 5,
        availablePlaces: 0,
        full: true,
        isPublic: true,
      },
    ]);

    render(<GameListCard />);

    await waitFor(() => {
      const buttons = screen.getAllByText("Complet");
      const disabledButton = buttons.find(
        (el) => el.tagName === "BUTTON" || el.closest("button"),
      );
      expect(disabledButton).toBeDefined();
    });
    expect(
      screen.getByRole("button", { name: "Forêt est complet" }),
    ).toBeDisabled();
  });

  it("shows cancel button when user is already registered", async () => {
    mockedGetCurrentUser.mockResolvedValue({ role: "ROLE_USER" } as never);
    mockedGetMyGameRegistrations.mockResolvedValueOnce([
      {
        id: 42,
        gameId: 1,
        userId: 1,
        userFirstname: "Jean",
        userLastname: "Dupont",
        userEmail: "jean@test.com",
        userAge: 30,
        isPresent: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<GameListCard />);

    await screen.findByText("Annuler l'inscription");
    expect(
      screen.getByRole("button", { name: "Annuler l'inscription à Forêt" }),
    ).toBeInTheDocument();
  });

  it("handles register action successfully", async () => {
    mockedGetCurrentUser.mockResolvedValue({ role: "ROLE_USER" } as never);

    render(<GameListCard />);

    await screen.findByRole("button", { name: "S'inscrire à Forêt" });
    fireEvent.click(screen.getByRole("button", { name: "S'inscrire à Forêt" }));

    await waitFor(() => {
      expect(mockedRegisterToGame).toHaveBeenCalledWith(1);
    });

    expect(
      await screen.findByRole("button", {
        name: "Annuler l'inscription à Forêt",
      }),
    ).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("shows register error when API fails", async () => {
    mockedGetCurrentUser.mockResolvedValue({ role: "ROLE_USER" } as never);
    mockedRegisterToGame.mockRejectedValueOnce(
      new Error("Inscription impossible"),
    );

    render(<GameListCard />);

    await screen.findByRole("button", { name: "S'inscrire à Forêt" });
    fireEvent.click(screen.getByRole("button", { name: "S'inscrire à Forêt" }));

    expect(
      await screen.findByText("Inscription impossible"),
    ).toBeInTheDocument();
  });

  it("handles cancel action successfully", async () => {
    mockedGetCurrentUser.mockResolvedValue({ role: "ROLE_USER" } as never);
    mockedGetMyGameRegistrations.mockResolvedValueOnce([
      {
        id: 42,
        gameId: 1,
        userId: 1,
        userFirstname: "Jean",
        userLastname: "Dupont",
        userEmail: "jean@test.com",
        userAge: 30,
        isPresent: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<GameListCard />);

    await screen.findByRole("button", {
      name: "Annuler l'inscription à Forêt",
    });
    fireEvent.click(
      screen.getByRole("button", { name: "Annuler l'inscription à Forêt" }),
    );

    await waitFor(() => {
      expect(mockedCancelGameRegistration).toHaveBeenCalledWith(42);
    });
  });

  it("reacts to auth state changes by loading registrations", async () => {
    mockedGetCurrentUser.mockRejectedValueOnce(new Error("unauthenticated"));
    mockedGetCurrentUser.mockResolvedValueOnce({ role: "ROLE_USER" } as never);
    mockedGetMyGameRegistrations.mockResolvedValueOnce([
      {
        id: 77,
        gameId: 1,
        userId: 1,
        userFirstname: "Jean",
        userLastname: "Dupont",
        userEmail: "jean@test.com",
        userAge: 30,
        isPresent: false,
        createdAt: new Date().toISOString(),
      },
    ]);

    render(<GameListCard />);

    await screen.findByText("Forêt");
    expect(
      screen.getAllByRole("link", { name: "Se connecter pour s'inscrire" }),
    ).toHaveLength(2);

    window.dispatchEvent(new Event(AUTH_STATE_CHANGE_EVENT));

    await waitFor(() => {
      expect(mockedGetMyGameRegistrations).toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "Annuler l'inscription à Forêt" }),
      ).toBeInTheDocument();
    });
  });

  it("shows empty state when there are no upcoming games", async () => {
    mockedGetGames.mockResolvedValueOnce([
      {
        id: 1,
        title: "Ancienne partie",
        description: "Partie passée",
        startDateTime: new Date(Date.now() - 86400000).toISOString(),
        address: "Domaine de la Forêt",
        price: 15,
        maxPlaces: 24,
        registrationCount: 0,
        availablePlaces: 24,
        full: false,
        isPublic: true,
      },
    ]);

    render(<GameListCard />);

    expect(
      await screen.findByText("Aucune partie a venir pour le moment."),
    ).toBeInTheDocument();
  });

  it("shows error when games cannot be loaded", async () => {
    mockedGetGames.mockRejectedValueOnce(new Error("Serveur indisponible"));

    render(<GameListCard />);

    expect(await screen.findByText("Serveur indisponible")).toBeInTheDocument();
  });

  it("shows 'Se connecter' link button for unauthenticated user", async () => {
    mockedGetCurrentUser.mockRejectedValue(new Error("unauthenticated"));

    render(<GameListCard />);

    await screen.findByText("Forêt");
    expect(
      screen.getAllByRole("link", { name: "Se connecter pour s'inscrire" }),
    ).toHaveLength(2);
  });
});
