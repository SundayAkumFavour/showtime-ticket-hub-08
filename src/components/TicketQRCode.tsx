import { QRCodeSVG } from 'qrcode.react';
import { forwardRef } from 'react';

interface TicketQRCodeProps {
  orderId: string;
  reference: string;
  showTitle: string;
  venue: string;
  date: string;
  time: string;
  ticketTier: string;
  quantity: number;
  seatInfo?: string;
}

export const TicketQRCode = forwardRef<HTMLDivElement, TicketQRCodeProps>(
  ({ orderId, reference, showTitle, venue, date, time, ticketTier, quantity, seatInfo }, ref) => {
    const qrData = JSON.stringify({
      orderId,
      reference,
      timestamp: Date.now(),
    });

    const formattedDate = new Date(date).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });

    return (
      <div
        ref={ref}
        className="bg-background border border-border rounded-2xl overflow-hidden max-w-sm mx-auto"
        style={{ printColorAdjust: 'exact' }}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-primary to-primary/80 p-4 text-center">
          <h2 className="font-display text-xl font-bold text-primary-foreground">
            🎫 EVENT TICKET
          </h2>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Show Info */}
          <div className="text-center">
            <h3 className="font-display text-lg font-bold text-foreground">{showTitle}</h3>
            <p className="text-sm text-muted-foreground">{venue}</p>
          </div>

          {/* Details Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Date</p>
              <p className="font-semibold text-foreground">{formattedDate}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Time</p>
              <p className="font-semibold text-foreground">{time}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Ticket Type</p>
              <p className="font-semibold text-foreground">{ticketTier}</p>
            </div>
            <div>
              <p className="text-muted-foreground">Quantity</p>
              <p className="font-semibold text-foreground">{quantity} ticket(s)</p>
            </div>
          </div>

          {seatInfo && (
            <div className="text-center p-2 bg-muted/50 rounded-lg">
              <p className="text-xs text-muted-foreground">Seats</p>
              <p className="font-semibold text-foreground">{seatInfo}</p>
            </div>
          )}

          {/* QR Code */}
          <div className="flex justify-center py-4">
            <div className="bg-white p-3 rounded-lg">
              <QRCodeSVG
                value={qrData}
                size={150}
                level="H"
                includeMargin={false}
              />
            </div>
          </div>

          {/* Reference */}
          <div className="text-center border-t border-dashed border-border pt-4">
            <p className="text-xs text-muted-foreground">Reference Code</p>
            <p className="font-mono text-sm font-bold text-primary">{reference}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-muted/30 px-4 py-3 text-center">
          <p className="text-xs text-muted-foreground">
            Present this QR code at the venue entrance
          </p>
        </div>
      </div>
    );
  }
);

TicketQRCode.displayName = 'TicketQRCode';
