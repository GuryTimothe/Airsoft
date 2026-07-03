import { render, screen } from "@testing-library/react";
import { GameListCard } from "./GameListCard";
import { getGames } from "@/lib/game-api";

jest.mock("@/lib/game-api", () => ({
  getGames: jest.fn(),
}));

jest.mock("@/assets/images/game-banner.jpg", () => ({
  src: "/game-banner.jpg",
}));

const mockedGetGames = getGames as jest.MockedFunction<typeof getGames>;

describe("GameListCard", () => {
  beforeEach(() => {
    mockedGetGames.mockResolvedValue([
      {
        id: 1,
        title: "Forêt",
        description: "Partie en forêt",
        startDateTime: new Date(Date.now() + 86400000).toISOString(),
        address: "Domaine de la Forêt",
        price: 15,
        maxPlaces: 24,
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
        isPublic: false,
      },
    ]);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("renders upcoming public games and shows the static banner", async () => {
    const { container } = render(<GameListCard />);

    expect(screen.getByText("Chargement des parties…")).toBeInTheDocument();
    expect(await screen.findByText("Forêt")).toBeInTheDocument();

    const listItems = screen.getAllByRole("listitem");
    expect(listItems).toHaveLength(1);

    const banner = container.querySelector('[data-testid="game-banner"]');
    expect(banner).toBeInTheDocument();
    expect(banner).toHaveStyle("background-image: url(/game-banner.jpg)");
  });
});
