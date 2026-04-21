import * as React from "react"
import * as RechartsPrimitive from "recharts"
import { cn } from "@/lib/utils"

// ─── Config Types ───────────────────────────────────────────────────────────

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode
    icon?: React.ComponentType
    color?: string
    theme?: Record<string, string>
  }
}

// ─── Context ─────────────────────────────────────────────────────────────────

type ChartContextProps = { config: ChartConfig }

const ChartContext = React.createContext<ChartContextProps | null>(null)

function useChart() {
  const context = React.useContext(ChartContext)
  if (!context) throw new Error("useChart must be used within a <ChartContainer />.")
  return context
}

// ─── ChartStyle (CSS variable injection) ─────────────────────────────────────

const THEMES = { light: "", dark: ".dark" } as const

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorConfig = Object.entries(config).filter(
    ([, item]) => item.theme || item.color
  )
  if (!colorConfig.length) return null

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: Object.entries(THEMES)
          .map(([theme, prefix]) =>
            [
              `${prefix} [data-chart=${id}] {`,
              ...colorConfig.map(([key, item]) => {
                const color = item.theme?.[theme as keyof typeof item.theme] || item.color
                return color ? `  --color-${key}: ${color};` : null
              }),
              `}`,
            ]
              .filter(Boolean)
              .join("\n")
          )
          .join("\n"),
      }}
    />
  )
}

// ─── ChartContainer ──────────────────────────────────────────────────────────

const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div"> & { config: ChartConfig; children: React.ReactNode }
>(({ id, className, config, children, ...props }, ref) => {
  const uniqueId = React.useId()
  const chartId = `chart-${id || uniqueId.replace(/:/g, "")}`
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [size, setSize] = React.useState<{ width: number; height: number } | null>(null)

  React.useLayoutEffect(() => {
    const el = containerRef.current
    if (!el) return
    const observer = new ResizeObserver(([entry]) => {
      const { width, height } = entry.contentRect
      if (width > 0 && height > 0) {
        setSize({ width, height })
      }
    })
    observer.observe(el)
    // Measure immediately in case it already has size
    const rect = el.getBoundingClientRect()
    if (rect.width > 0 && rect.height > 0) {
      setSize({ width: rect.width, height: rect.height })
    }
    return () => observer.disconnect()
  }, [])

  // Merge the external ref with our internal ref
  const setRefs = React.useCallback(
    (node: HTMLDivElement | null) => {
      (containerRef as React.MutableRefObject<HTMLDivElement | null>).current = node
      if (typeof ref === "function") ref(node)
      else if (ref) (ref as React.MutableRefObject<HTMLDivElement | null>).current = node
    },
    [ref]
  )

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={setRefs}
        className={cn(
          "flex aspect-video justify-center text-xs",
          "[&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground",
          "[&_.recharts-cartesian-grid_line[stroke='#ccc']]:stroke-border/50",
          "[&_.recharts-dot]:stroke-transparent",
          "[&_.recharts-layer]:outline-none",
          "[&_.recharts-radial-bar-background-sector]:fill-muted",
          "[&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted",
          "[&_.recharts-sector[stroke='#fff']]:stroke-transparent",
          "[&_.recharts-sector]:outline-none",
          "[&_.recharts-surface]:outline-none",
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        {size && (
          <RechartsPrimitive.ResponsiveContainer width={size.width} height={size.height}>
            {children as React.ReactElement}
          </RechartsPrimitive.ResponsiveContainer>
        )}
      </div>
    </ChartContext.Provider>
  )
})
ChartContainer.displayName = "ChartContainer"

// ─── Tooltip ─────────────────────────────────────────────────────────────────

const ChartTooltip = RechartsPrimitive.Tooltip

// We define our own explicit props to avoid recharts' internal Omit chain
// which strips `payload`, `active`, and `label` from the public type.
interface ChartTooltipContentProps {
  active?: boolean
  payload?: Array<{
    dataKey?: string | number
    name?: string
    value?: number | string
    color?: string
    fill?: string
    payload?: Record<string, unknown>
    [key: string]: unknown
  }>
  label?: unknown
  labelFormatter?: (label: unknown, payload: unknown[]) => React.ReactNode
  className?: string
  labelClassName?: string
  hideLabel?: boolean
  hideIndicator?: boolean
  indicator?: "line" | "dot" | "dashed"
  nameKey?: string
  labelKey?: string
  color?: string
}

const ChartTooltipContent = React.forwardRef<HTMLDivElement, ChartTooltipContentProps>(
  (
    {
      active,
      payload,
      className,
      indicator = "dot",
      hideLabel = false,
      hideIndicator = false,
      label,
      labelFormatter,
      labelClassName,
      color,
      nameKey,
      labelKey,
    },
    ref
  ) => {
    const { config } = useChart()

    const tooltipLabel = React.useMemo(() => {
      if (hideLabel || !payload?.length) return null

      const [item] = payload
      const key = `${labelKey || item.dataKey || item.name || "value"}`
      const itemConfig = getPayloadConfigFromCustomKey(config, item, key)
      const value =
        !labelKey && typeof label === "string"
          ? config[label as keyof typeof config]?.label || label
          : itemConfig?.label

      if (labelFormatter) {
        return (
          <div className={cn("font-medium", labelClassName)}>
            {labelFormatter(value, payload)}
          </div>
        )
      }

      if (!value) return null

      return <div className={cn("font-medium", labelClassName)}>{value as React.ReactNode}</div>
    }, [label, labelFormatter, payload, hideLabel, labelClassName, config, labelKey])

    if (!active || !payload?.length) return null

    const nestLabel = payload.length === 1 && indicator !== "dot"

    return (
      <div
        ref={ref}
        className={cn(
          "grid min-w-[8rem] items-start gap-1.5 rounded-lg border border-border/50 bg-background px-2.5 py-1.5 text-xs shadow-xl",
          className
        )}
      >
        {!nestLabel ? tooltipLabel : null}
        <div className="grid gap-1.5">
          {payload.map((item) => {
            const key = `${nameKey || item.name || item.dataKey || "value"}`
            const itemConfig = getPayloadConfigFromCustomKey(config, item, key)
            const indicatorColor = color || (item.payload as any)?.fill || item.color

            return (
              <div
                key={String(item.dataKey ?? item.name ?? Math.random())}
                className={cn(
                  "flex w-full items-stretch gap-2 [&>svg]:h-2.5 [&>svg]:w-2.5 [&>svg]:text-muted-foreground",
                  nestLabel ? "items-end" : "items-center"
                )}
              >
                {(() => {
                  if (itemConfig?.icon) return <itemConfig.icon />
                  if (hideIndicator) return null
                  const isDot = indicator === "dot"
                  const indicatorClass = cn(
                    "shrink-0 rounded-[2px] border-[--color-border] bg-[--color-bg]",
                    isDot && "h-2.5 w-2.5",
                    indicator === "line" && "w-1",
                    indicator === "dashed" && "w-0 border-[1.5px] border-dashed bg-transparent",
                    nestLabel && isDot && "my-0.5"
                  )
                  return (
                    <div
                      className={indicatorClass}
                      style={{
                        "--color-bg": indicatorColor,
                        "--color-border": indicatorColor,
                      } as React.CSSProperties}
                    />
                  )
                })()}
                <div
                  className={cn(
                    "flex flex-1 justify-between leading-none",
                    nestLabel ? "items-end" : "items-center"
                  )}
                >
                  <div className="grid gap-1.5">
                    {nestLabel ? tooltipLabel : null}
                    <span className="text-muted-foreground">
                      {itemConfig?.label || item.name}
                    </span>
                  </div>
                  {item.value != null && (
                    <span className="font-mono font-medium tabular-nums text-foreground">
                      {Number(item.value).toLocaleString()}
                    </span>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }
)
ChartTooltipContent.displayName = "ChartTooltipContent"

// ─── Legend ──────────────────────────────────────────────────────────────────

const ChartLegend = RechartsPrimitive.Legend

interface ChartLegendContentProps extends React.ComponentProps<"div"> {
  payload?: Array<{
    value?: string | number
    dataKey?: string | number
    color?: string
    [key: string]: unknown
  }>
  verticalAlign?: "top" | "bottom" | "middle"
  hideIcon?: boolean
  nameKey?: string
}

const ChartLegendContent = React.forwardRef<HTMLDivElement, ChartLegendContentProps>(
  ({ className, hideIcon = false, payload, verticalAlign = "bottom", nameKey }, ref) => {
    const { config } = useChart()

    if (!payload?.length) return null

    return (
      <div
        ref={ref}
        className={cn(
          "flex items-center justify-center gap-4",
          verticalAlign === "top" ? "pb-3" : "pt-3",
          className
        )}
      >
        {payload.map((item) => {
          const key = `${nameKey || item.dataKey || "value"}`
          const itemConfig = getPayloadConfigFromCustomKey(config, item, key)

          return (
            <div
              key={String(item.value)}
              className="flex items-center gap-1.5 [&>svg]:h-3 [&>svg]:w-3 [&>svg]:text-muted-foreground"
            >
              {itemConfig?.icon && !hideIcon ? (
                <itemConfig.icon />
              ) : (
                <div
                  className="h-2 w-2 shrink-0 rounded-[2px]"
                  style={{ backgroundColor: item.color }}
                />
              )}
              {itemConfig?.label ?? item.value}
            </div>
          )
        })}
      </div>
    )
  }
)
ChartLegendContent.displayName = "ChartLegendContent"

// ─── Helper ───────────────────────────────────────────────────────────────────

function getPayloadConfigFromCustomKey(
  config: ChartConfig,
  payload: unknown,
  key: string
): ChartConfig[string] | undefined {
  if (typeof payload !== "object" || payload === null) return undefined

  const payloadPayload =
    "payload" in payload &&
    typeof (payload as any).payload === "object" &&
    (payload as any).payload !== null
      ? (payload as any).payload
      : undefined

  let configLabelKey: string = key

  const p = payload as Record<string, unknown>
  if (key in p && typeof p[key] === "string") {
    configLabelKey = p[key] as string
  } else if (payloadPayload && key in payloadPayload && typeof payloadPayload[key] === "string") {
    configLabelKey = payloadPayload[key] as string
  }

  return configLabelKey in config ? config[configLabelKey] : config[key]
}

// ─── Exports ──────────────────────────────────────────────────────────────────

export {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
  ChartLegend,
  ChartLegendContent,
  ChartStyle,
}
