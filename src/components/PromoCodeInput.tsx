import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tag, X, Loader2, Check } from 'lucide-react';
import { useValidatePromoCode, PromoCode, calculateDiscount } from '@/hooks/usePromoCodes';

interface PromoCodeInputProps {
  showId: string;
  subtotal: number;
  onApply: (promo: PromoCode | null, discount: number) => void;
  appliedPromo: PromoCode | null;
}

export const PromoCodeInput = ({
  showId,
  subtotal,
  onApply,
  appliedPromo,
}: PromoCodeInputProps) => {
  const [code, setCode] = useState('');
  const validatePromo = useValidatePromoCode();

  const handleApply = () => {
    if (!code.trim()) return;

    validatePromo.mutate(
      { code: code.trim(), showId, amount: subtotal },
      {
        onSuccess: (promo) => {
          const discount = calculateDiscount(promo, subtotal);
          onApply(promo, discount);
          setCode('');
        },
      }
    );
  };

  const handleRemove = () => {
    onApply(null, 0);
    setCode('');
  };

  if (appliedPromo) {
    const discount = calculateDiscount(appliedPromo, subtotal);
    return (
      <div className="flex items-center justify-between p-3 bg-primary/10 rounded-lg border border-primary/20">
        <div className="flex items-center gap-2">
          <Check className="w-4 h-4 text-primary" />
          <div>
            <span className="font-medium text-foreground">{appliedPromo.code}</span>
            <span className="text-sm text-muted-foreground ml-2">
              {appliedPromo.discount_type === 'percentage'
                ? `${appliedPromo.discount_value}% off`
                : `₦${appliedPromo.discount_value.toLocaleString()} off`}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-primary font-medium">
            -₦{discount.toLocaleString()}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={handleRemove}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex gap-2">
        <div className="relative flex-1">
          <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter promo code"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="pl-9"
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
        </div>
        <Button
          variant="outline"
          onClick={handleApply}
          disabled={!code.trim() || validatePromo.isPending}
        >
          {validatePromo.isPending ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            'Apply'
          )}
        </Button>
      </div>
      {validatePromo.isError && (
        <p className="text-sm text-destructive">
          {(validatePromo.error as Error).message}
        </p>
      )}
    </div>
  );
};
