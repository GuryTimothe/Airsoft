import { getEmergencyContactByUserId } from "./emergency-contact-api";

jest.mock("@/lib/auth", () => ({
  getAuthHeaders: jest.fn(async () => ({ Authorization: "Bearer token" })),
}));

describe("emergency-contact-api", () => {
  let fetchMock: jest.Mock;

  beforeEach(() => {
    fetchMock = jest.fn();
    global.fetch = fetchMock as unknown as typeof fetch;
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("loads emergency contact by user id from hydra collection", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        "hydra:member": [
          {
            lastname: "Bernard",
            firstname: "Marie",
            email: "marie@example.com",
            phone: "0700000000",
          },
        ],
      }),
    });

    const contact = await getEmergencyContactByUserId(5);

    expect(fetchMock).toHaveBeenCalledWith(
      expect.stringContaining("/api/emergency_contacts?user.id=5"),
      expect.objectContaining({ cache: "no-store" }),
    );
    expect(contact).toEqual({
      lastname: "Bernard",
      firstname: "Marie",
      email: "marie@example.com",
      phone: "0700000000",
    });
  });

  it("returns null when no emergency contact exists for user", async () => {
    fetchMock.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ "hydra:member": [] }),
    });

    await expect(getEmergencyContactByUserId(99)).resolves.toBeNull();
  });
});
