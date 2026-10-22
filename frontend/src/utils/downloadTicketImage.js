const loadImage = (src) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to load the ticket QR code."));
    image.src = src;
  });

const roundedRect = (context, x, y, width, height, radius, color) => {
  context.fillStyle = color;
  context.beginPath();
  context.roundRect(x, y, width, height, radius);
  context.fill();
};

const wrapText = (context, text, x, y, maxWidth, lineHeight, maxLines = 3) => {
  const words = String(text || "").split(/\s+/).filter(Boolean);
  const lines = [];
  let line = "";

  for (const word of words) {
    const nextLine = line ? `${line} ${word}` : word;

    if (line && context.measureText(nextLine).width > maxWidth) {
      lines.push(line);
      line = word;
    } else {
      line = nextLine;
    }
  }

  if (line) lines.push(line);

  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines) {
    let lastLine = visibleLines[maxLines - 1];
    while (
      lastLine &&
      context.measureText(`${lastLine}…`).width > maxWidth
    ) {
      lastLine = lastLine.slice(0, -1);
    }
    visibleLines[maxLines - 1] = `${lastLine.trimEnd()}…`;
  }

  visibleLines.forEach((textLine, index) => {
    context.fillText(textLine, x, y + index * lineHeight);
  });

  return visibleLines.length;
};

const formatEventDate = (dateValue) => {
  if (!dateValue) return "Date to be announced";

  const date = new Date(dateValue);
  return Number.isNaN(date.getTime())
    ? "Date to be announced"
    : date.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      });
};

const formatTime = (event) => {
  if (!event?.startTime && !event?.endTime) return "Time to be announced";
  return `${event.startTime || "Time TBA"} – ${event.endTime || "Time TBA"}`;
};

const formatPassType = (passType) => {
  switch (passType) {
    case "SINGLE":
      return "Single Pass";
    case "COUPLE":
      return "Couple Pass";
    case "GROUP":
      return "Group Pass";
    default:
      return passType || "Event Pass";
  }
};

const createTicketCanvas = async (ticket, event) => {
  if (!ticket.qrCode) {
    throw new Error("The ticket QR code is unavailable. Reload the ticket and try again.");
  }

  const qrImage = await loadImage(ticket.qrCode);
  const canvas = document.createElement("canvas");
  canvas.width = 1400;
  canvas.height = 1800;

  const context = canvas.getContext("2d");
  if (!context) {
    throw new Error("Your browser could not prepare the ticket image.");
  }

  context.fillStyle = "#eaf8f6";
  context.fillRect(0, 0, canvas.width, canvas.height);
  roundedRect(context, 60, 60, 1280, 1680, 48, "#ffffff");

  const headerGradient = context.createLinearGradient(60, 60, 1340, 530);
  headerGradient.addColorStop(0, "#0f766e");
  headerGradient.addColorStop(0.55, "#0891b2");
  headerGradient.addColorStop(1, "#38bdf8");
  roundedRect(context, 60, 60, 1280, 490, 48, headerGradient);
  context.fillStyle = "#ffffff";
  context.fillRect(60, 500, 1280, 50);

  context.fillStyle = "rgba(255, 255, 255, 0.14)";
  context.beginPath();
  context.arc(1190, 140, 220, 0, Math.PI * 2);
  context.fill();
  context.beginPath();
  context.arc(1320, 410, 150, 0, Math.PI * 2);
  context.fill();

  context.textAlign = "left";
  context.fillStyle = "#d5fffb";
  context.font = "700 26px Arial, sans-serif";
  context.fillText("DHOLKI NIGHTS  /  DIGITAL ENTRY PASS", 120, 145);

  context.fillStyle = "#ffffff";
  context.font = "700 68px Arial, sans-serif";
  const titleLines = wrapText(
    context,
    event?.name || "Garba Night",
    120,
    250,
    1050,
    82,
    3,
  );

  context.fillStyle = "#e8fbff";
  context.font = "400 30px Arial, sans-serif";
  context.fillText("Your entry pass is ready", 120, 250 + titleLines * 82 + 8);

  roundedRect(context, 120, 590, 1160, 1040, 30, "#f7fbfc");

  const drawDetail = (label, value, x, y, width) => {
    context.fillStyle = "#64748b";
    context.font = "700 22px Arial, sans-serif";
    context.fillText(label.toUpperCase(), x, y);
    context.fillStyle = "#102a43";
    context.font = "700 34px Arial, sans-serif";
    wrapText(context, value || "Not provided", x, y + 48, width, 42, 3);
  };

  drawDetail("Event date", formatEventDate(event?.eventDate), 165, 665, 565);
  drawDetail(
    "Venue",
    [event?.venue?.name, event?.venue?.address].filter(Boolean).join(", ") ||
      "BHAGAT SHREE MARRIAGE GARDEN, Raja Ram Nagar, Dewas",
    165,
    820,
    565,
  );
  drawDetail("Timing", formatTime(event), 165, 1015, 565);
  drawDetail("Attendee", ticket.holderName || "Guest", 165, 1170, 565);
  drawDetail("Pass type", formatPassType(ticket.passType), 165, 1325, 255);
  drawDetail(
    "Members",
    `${ticket.membersCount} ${
      ticket.membersCount === 1 ? "person" : "people"
    }`,
    465,
    1325,
    265,
  );

  roundedRect(context, 785, 665, 430, 570, 24, "#ffffff");
  context.fillStyle = "#ffffff";
  context.fillRect(810, 690, 380, 380);
  context.imageSmoothingEnabled = false;
  context.drawImage(qrImage, 810, 690, 380, 380);
  context.imageSmoothingEnabled = true;
  context.fillStyle = "#0f766e";
  context.textAlign = "center";
  context.font = "700 22px Arial, sans-serif";
  context.fillText("SCAN AT THE EVENT", 1000, 1120);
  context.fillStyle = "#64748b";
  context.font = "400 20px Arial, sans-serif";
  context.fillText("One scan admits this pass", 1000, 1160);

  context.textAlign = "left";
  context.fillStyle = "#64748b";
  context.font = "700 22px Arial, sans-serif";
  context.fillText("TICKET NUMBER", 165, 1510);
  context.fillStyle = "#102a43";
  context.font = "700 34px monospace";
  wrapText(context, ticket.ticketNumber, 165, 1560, 1040, 42, 2);

  context.fillStyle = "#64748b";
  context.font = "400 20px Arial, sans-serif";
  context.fillText(
    "Govt ID required · No entry after 8:30 PM · Follow event terms",
    165,
    1670,
  );
  context.textAlign = "right";
  context.fillStyle = "#0f766e";
  context.font = "700 22px Arial, sans-serif";
  context.fillText("DHOLKI NIGHTS", 1280, 1670);

  return canvas;
};

export const downloadTicketImage = async (ticket, event) => {
  const canvas = await createTicketCanvas(ticket, event);
  const imageBlob = await new Promise((resolve) => {
    canvas.toBlob(resolve, "image/png");
  });

  if (!imageBlob) {
    throw new Error("Unable to create the ticket image. Please try again.");
  }

  const imageUrl = URL.createObjectURL(imageBlob);
  const link = document.createElement("a");
  const ticketNumber = String(ticket.ticketNumber || "ticket").replace(
    /[^a-zA-Z0-9-_]/g,
    "-",
  );
  link.href = imageUrl;
  link.download = `Dholki-Nights-${ticketNumber}.png`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1000);
};
