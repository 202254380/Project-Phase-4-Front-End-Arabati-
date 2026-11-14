import { dateAt } from "../domain/rules.js";
export const DATA_VERSION = 1;
export function createSeed(now = new Date()) {
  const stamp = (offset) => `${dateAt(offset, now)}T10:00:00+03:00`;
  const users = [
    {
      id: "customer-demo",
      name: "Mhammed",
      email: "customer@arabati.demo",
      mobile: "0500000101",
      role: "customer",
      status: "Active",
      demo: true,
    },
    {
      id: "vendor-demo",
      name: "Roast & Gather",
      email: "vendor@arabati.demo",
      mobile: "0500000102",
      role: "vendor",
      status: "Active",
      demo: true,
    },
    {
      id: "admin-demo",
      name: "Platform administrator",
      email: "admin@arabati.demo",
      mobile: "0500000103",
      role: "admin",
      status: "Active",
      demo: true,
    },
    ...[
      "Saffron Street",
      "Sugar & Crumb",
      "The Matcha Edit",
      "Ember Kitchen",
      "Little Gelato",
      "Palm Coffee",
      "Saj & Social",
    ].map((name, i) => ({
      id: `vendor-${i + 2}`,
      name,
      email: `vendor${i + 2}@arabati.demo`,
      mobile: `05000002${String(i).padStart(2, "0")}`,
      role: "vendor",
      status: "Active",
      demo: true,
    })),
  ];
  const specs = [
    [
      "roast",
      "Roast & Gather",
      "Coffee",
      "Specialty coffee, thoughtfully served.",
      "A warm, welcoming coffee cart with specialty espresso, Arabic coffee and a barista team that makes every guest feel at home.",
      ["Al Khobar", "Dammam", "Dhahran"],
      1200,
      100,
      3,
      "terracotta",
      "vendor-demo",
      "Approved",
    ],
    [
      "saffron",
      "Saffron Street",
      "Food",
      "A little street food. A lot of soul.",
      "Fresh sliders and golden fries, prepared at your event. A crowd-pleasing menu for celebrations that deserve something delicious.",
      ["Al Khobar", "Dammam", "Qatif"],
      1400,
      80,
      3,
      "sage",
      "vendor-2",
      "Approved",
    ],
    [
      "sugar",
      "Sugar & Crumb",
      "Desserts",
      "Sweet moments, made from scratch.",
      "Fresh waffles, small-batch cookies and delightful dessert cups for birthdays, graduations and every sweet milestone.",
      ["Al Khobar", "Dhahran", "Dammam"],
      950,
      70,
      2,
      "rose",
      "vendor-3",
      "Approved",
    ],
    [
      "matcha",
      "The Matcha Edit",
      "Coffee",
      "A fresh take on your coffee break.",
      "Ceremonial matcha, iced specialty drinks and espresso classics. A calm green corner for your next gathering.",
      ["Al Khobar", "Dhahran"],
      1100,
      80,
      3,
      "olive",
      "vendor-4",
      "Approved",
    ],
    [
      "ember",
      "Ember Kitchen",
      "Food",
      "Fire up a memorable evening.",
      "Wood-fired flatbreads and sharing plates, finished fresh at the cart. Perfect for outdoor events and company gatherings.",
      ["Dammam", "Jubail", "Al Khobar"],
      1800,
      120,
      4,
      "charcoal",
      "vendor-5",
      "Approved",
    ],
    [
      "gelato",
      "Little Gelato",
      "Desserts",
      "Happiness, by the scoop.",
      "Creamy artisan gelato in six seasonal flavours. Our colourful little cart brings joy to celebrations big and small.",
      ["Al Khobar", "Dammam", "Qatif"],
      1300,
      100,
      3,
      "butter",
      "vendor-6",
      "Approved",
    ],
    [
      "palm",
      "Palm Coffee",
      "Coffee",
      "Rooted in good coffee.",
      "Arabic coffee and hand-crafted espresso drinks served from our palm-inspired cart, with warm hospitality for every guest.",
      ["Dammam", "Dhahran"],
      1000,
      80,
      3,
      "olive",
      "vendor-7",
      "Pending",
    ],
    [
      "saj",
      "Saj & Social",
      "Food",
      "Made fresh. Shared together.",
      "Traditional saj wraps, fresh fillings and friendly service for private gatherings and company celebrations across the Eastern Province.",
      ["Qatif", "Dammam"],
      1600,
      100,
      3,
      "sage",
      "vendor-8",
      "Rejected",
    ],
  ];
  const carts = specs.map(
    (
      [
        id,
        name,
        category,
        tagline,
        description,
        cities,
        price,
        capacity,
        duration,
        theme,
        vendorId,
        status,
      ],
      i,
    ) => ({
      id,
      name,
      category,
      tagline,
      description,
      cities,
      baseCity: cities[0],
      theme,
      vendorId,
      status,
      suspended: false,
      blockedDates: i === 0 ? [dateAt(8, now)] : [],
      photo: null,
      rejectionReason:
        status === "Rejected"
          ? "Please include a clear package description and menu prices."
          : "",
      submittedAt: stamp(-2),
      packages: [
        {
          id: `${id}-standard`,
          name: "Standard gathering",
          price,
          capacity,
          duration,
          description: `Everything you need for up to ${capacity} guests, with ${duration} hours of friendly service.`,
        },
        {
          id: `${id}-celebration`,
          name: "The celebration",
          price: price + 650,
          capacity: capacity + 60,
          duration: duration + 1,
          description:
            "More guests, more time, and a little extra. Includes an extended menu and dedicated setup.",
        },
      ],
      menu:
        category === "Coffee"
          ? [
              { id: `${id}-1`, name: "Spanish latte", price: 22 },
              { id: `${id}-2`, name: "Flat white", price: 18 },
              { id: `${id}-3`, name: "Arabic coffee", price: 12 },
              { id: `${id}-4`, name: "Iced matcha", price: 24 },
            ]
          : category === "Food"
            ? [
                { id: `${id}-1`, name: "Signature sliders", price: 32 },
                { id: `${id}-2`, name: "Loaded fries", price: 24 },
                { id: `${id}-3`, name: "Fresh lemonade", price: 14 },
              ]
            : [
                { id: `${id}-1`, name: "Belgian waffle", price: 28 },
                { id: `${id}-2`, name: "Signature dessert cup", price: 22 },
                { id: `${id}-3`, name: "Double scoop", price: 18 },
              ],
    }),
  );
  function booking(id, cartId, status, offset, overrides = {}) {
    const cart = carts.find((c) => c.id === cartId),
      pkg = cart.packages[0];
    const requested = offset < 0 ? offset - 5 : -3,
      decided = offset < 0 ? offset - 4 : -2;
    const history = [
      {
        status: "Pending",
        at: stamp(requested),
        note: "Booking request submitted.",
      },
    ];
    if (status === "Completed")
      history.push(
        {
          status: "Accepted",
          at: stamp(decided),
          note: "Vendor accepted the request.",
        },
        {
          status: "Completed",
          at: stamp(offset + 1),
          note: "Event completed. Thank you for celebrating with us.",
        },
      );
    else if (status !== "Pending")
      history.push({
        status,
        at: stamp(decided),
        note: `Booking ${status.toLowerCase()}.`,
      });
    return {
      id,
      cartId,
      vendorId: cart.vendorId,
      customerId: "customer-demo",
      status,
      date: dateAt(offset, now),
      time: "18:00",
      venue: "Al Khobar celebration hall",
      city: cart.cities[0],
      guests: 60,
      duration: pkg.duration,
      budget: pkg.price + 300,
      notes:
        "Outdoor power available. Please arrive 30 minutes before the start.",
      package: { ...pkg },
      cartName: cart.name,
      createdAt: stamp(requested),
      history,
      ...overrides,
    };
  }
  const bookings = [
    booking("ARB-1042", "roast", "Pending", 6),
    booking("ARB-1043", "roast", "Pending", 7, {
      customerId: "customer-guest",
      customerName: "Sara Abdullah",
      guests: 80,
    }),
    booking("ARB-1044", "saffron", "Accepted", 10),
    booking("ARB-1030", "roast", "Accepted", 12),
    booking("ARB-1020", "roast", "Accepted", -1),
    booking("ARB-0931", "roast", "Completed", -10),
    booking("ARB-0920", "sugar", "Cancelled", -12),
  ];
  users.push({
    id: "customer-guest",
    name: "Sara Abdullah",
    email: "sara@arabati.demo",
    mobile: "0500000104",
    role: "customer",
    status: "Active",
    demo: true,
  });
  const reviews = carts
    .filter((c) => c.status === "Approved")
    .flatMap((cart, i) => [
      {
        id: `REV-${i * 2 + 80}`,
        cartId: cart.id,
        bookingId: `historic-${i}-a`,
        customerId: "historical-customer-a",
        author: "Noura A.",
        rating: 5,
        text: "Beautiful setup and lovely service. Our guests really enjoyed every moment!",
        createdAt: stamp(-18),
        hidden: false,
      },
      {
        id: `REV-${i * 2 + 81}`,
        cartId: cart.id,
        bookingId: `historic-${i}-b`,
        customerId: "historical-customer-b",
        author: "Fahad M.",
        rating: i === 0 ? 4 : 5,
        text: "Friendly team, arrived on time and everything was freshly prepared. Would book again.",
        createdAt: stamp(-14),
        hidden: false,
      },
    ]);
  return {
    version: DATA_VERSION,
    revision: 0,
    users,
    carts,
    bookings,
    reviews,
    reports: [
      {
        id: "R-204",
        targetType: "review",
        targetId: "REV-81",
        cartId: "roast",
        reporterId: "customer-guest",
        reason: "Misleading information",
        details:
          "The review may describe a different event. Please check that it belongs to this cart.",
        status: "Open",
        createdAt: stamp(-1),
      },
    ],
    notifications: [
      {
        id: "N-1",
        userId: "customer-demo",
        title: "Your booking was accepted",
        body: "Saffron Street is getting ready for your gathering.",
        bookingId: "ARB-1044",
        read: false,
        createdAt: stamp(-1),
      },
      {
        id: "N-2",
        userId: "vendor-demo",
        title: "A new gathering is waiting",
        body: "You have a new booking request to review.",
        bookingId: "ARB-1042",
        read: false,
        createdAt: stamp(-1),
      },
      {
        id: "N-3",
        userId: "admin-demo",
        title: "A vendor needs your review",
        body: "Palm Coffee has submitted a listing for verification.",
        cartId: "palm",
        read: false,
        createdAt: stamp(-2),
      },
    ],
    audit: [],
    resetTokens: [],
    loginAttempts: [],
    sequence: 1100,
  };
}
