import { ArrowDownRight, ArrowUpRight, Minus } from "lucide-react";

const AdminStatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  trendLabel,
  iconClassName = "bg-cyan-50 text-cyan-600",
}) => {
  const trendPositive = typeof trend === "number" && trend > 0;

  const trendNegative = typeof trend === "number" && trend < 0;

  return (
    <div className="rounded-[1.75rem] border border-white/80 bg-white/75 p-5 shadow-[0_15px_50px_rgba(15,118,110,0.07)] backdrop-blur-xl transition hover:-translate-y-0.5 hover:shadow-[0_20px_60px_rgba(15,118,110,0.10)]">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-slate-500">{title}</p>

          <p className="mt-2 text-3xl font-black tracking-tight text-slate-900">
            {value}
          </p>

          {subtitle && (
            <p className="mt-1 text-xs font-medium text-slate-400">
              {subtitle}
            </p>
          )}
        </div>

        {Icon && (
          <div
            className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClassName}`}
          >
            <Icon size={20} />
          </div>
        )}
      </div>

      {trend !== undefined && (
        <div className="mt-5 flex items-center gap-2">
          <span
            className={[
              "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold",
              trendPositive
                ? "bg-emerald-50 text-emerald-600"
                : trendNegative
                  ? "bg-red-50 text-red-600"
                  : "bg-slate-100 text-slate-500",
            ].join(" ")}
          >
            {trendPositive ? (
              <ArrowUpRight size={13} />
            ) : trendNegative ? (
              <ArrowDownRight size={13} />
            ) : (
              <Minus size={13} />
            )}
            {Math.abs(trend)}%
          </span>

          {trendLabel && (
            <span className="text-xs font-medium text-slate-400">
              {trendLabel}
            </span>
          )}
        </div>
      )}
    </div>
  );
};

export default AdminStatCard;
