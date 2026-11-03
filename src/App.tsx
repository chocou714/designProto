import { useMemo, useState } from "react"
import { locations, nationalAverage, periods } from "./airQualityData"

type Series = {
  id: string
  label: string
  region?: string
  values: Array<number | null>
}

const regionOrder = [...new Set(locations.map((item) => item.region))]
const shortRegion: Record<string, string> = {
  서울특별시: "서울",
  부산광역시: "부산",
  대구광역시: "대구",
  인천광역시: "인천",
  광주광역시: "광주",
  대전광역시: "대전",
  울산광역시: "울산",
  세종특별자치시: "세종",
  경기도: "경기",
  강원특별자치도: "강원",
  충청북도: "충북",
  충청남도: "충남",
  전북특별자치도: "전북",
  전라남도: "전남",
  경상북도: "경북",
  경상남도: "경남",
  제주특별자치도: "제주",
}

const formatPeriod = (period: string) => {
  const [year, month] = period.split(".")
  return `${year.slice(2)}.${month}`
}

const formatValue = (value: number | null | undefined) =>
  value === null || value === undefined ? "—" : value.toFixed(2)

function averageAt(
  rows: Array<{ values: Array<number | null> }>,
  index: number,
) {
  const values = rows
    .map((row) => row.values[index])
    .filter((value): value is number => value !== null)
  return values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : null
}

const regionSeries: Series[] = regionOrder.map((region) => {
  const rows = locations.filter((item) => item.region === region)
  return {
    id: region,
    label: shortRegion[region] ?? region,
    region,
    values: periods.map((_, index) => averageAt(rows, index)),
  }
})

function Icon({
  name,
  size = 20,
}: {
  name: "wind" | "download" | "arrow" | "info" | "chevron"
  size?: number
}) {
  const paths = {
    wind: (
      <>
        <path d="M3 8h11.5a2.5 2.5 0 1 0-2.1-3.85" />
        <path d="M3 12h16" />
        <path d="M3 16h11.5a2.5 2.5 0 1 1-2.1 3.85" />
      </>
    ),
    download: (
      <>
        <path d="M12 3v12m-5-5 5 5 5-5" />
        <path d="M5 21h14" />
      </>
    ),
    arrow: <path d="m5 12 5 5L20 7" />,
    info: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M12 11v5m0-8h.01" />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
  }
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  )
}

function LineChart({
  series,
  activeId,
  onActive,
}: {
  series: Series[]
  activeId: string
  onActive: (id: string) => void
}) {
  const width = 1100
  const height = 410
  const margin = { top: 24, right: 24, bottom: 52, left: 54 }
  const allValues = series.flatMap((item) =>
    item.values.filter((value): value is number => value !== null),
  )
  const rawMin = Math.min(...allValues)
  const rawMax = Math.max(...allValues)
  const min = Math.max(0, Math.floor((rawMin - 0.04) * 10) / 10)
  const max = Math.ceil((rawMax + 0.04) * 10) / 10
  const span = max - min || 0.1
  const x = (index: number) =>
    margin.left +
    index * ((width - margin.left - margin.right) / (periods.length - 1))
  const y = (value: number) =>
    margin.top + ((max - value) / span) * (height - margin.top - margin.bottom)
  const ticks = Array.from(
    { length: 5 },
    (_, index) => min + (span / 4) * index,
  )
  const pathFor = (values: Array<number | null>) =>
    values
      .map((value, index) =>
        value === null
          ? null
          : `${
              index === 0 || values[index - 1] === null ? "M" : "L"
            }${x(index)} ${y(value)}`,
      )
      .filter(Boolean)
      .join(" ")
  const active = series.find((item) => item.id === activeId)

  return (
    <div className="chart-stage">
      <svg
        className="line-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="월별 일산화탄소 농도 꺾은선 그래프"
      >
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className="grid-line"
              x1={margin.left}
              x2={width - margin.right}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text
              className="axis-label"
              x={margin.left - 15}
              y={y(tick) + 4}
              textAnchor="end"
            >
              {tick.toFixed(1)}
            </text>
          </g>
        ))}
        {periods.map((period, index) => (
          <text
            className="axis-label month"
            key={period}
            x={x(index)}
            y={height - 17}
            textAnchor="middle"
          >
            {formatPeriod(period)}
          </text>
        ))}
        {series.map((item) => {
          const isActive = item.id === activeId
          return (
            <path
              key={item.id}
              className={`data-line ${isActive ? "active" : ""}`}
              d={pathFor(item.values)}
              onMouseEnter={() => onActive(item.id)}
              onFocus={() => onActive(item.id)}
              tabIndex={0}
              aria-label={`${item.label} 추이`}
            />
          )
        })}
        {active?.values.map(
          (value, index) =>
            value !== null && (
              <g key={periods[index]}>
                <circle
                  className="data-point"
                  cx={x(index)}
                  cy={y(value)}
                  r="4.5"
                />
                {index === active.values.length - 1 && (
                  <g transform={`translate(${x(index) - 61} ${y(value) - 42})`}>
                    <rect className="value-tag" width="58" height="27" rx="4" />
                    <text
                      className="value-text"
                      x="29"
                      y="18"
                      textAnchor="middle"
                    >
                      {value.toFixed(2)}
                    </text>
                  </g>
                )}
              </g>
            ),
        )}
      </svg>
    </div>
  )
}

function App() {
  const [selectedRegion, setSelectedRegion] = useState("전체")
  const [activeLine, setActiveLine] = useState(regionSeries[0].id)

  const districtSeries = useMemo<Series[]>(
    () =>
      locations
        .filter((item) => item.region === selectedRegion)
        .map((item) => ({
          id: item.id,
          label: item.city,
          region: item.region,
          values: item.values,
        })),
    [selectedRegion],
  )

  const visibleSeries =
    selectedRegion === "전체" ? regionSeries : districtSeries
  const latestIndex = periods.length - 1
  const latestRanking = [...visibleSeries]
    .filter((item) => item.values[latestIndex] !== null)
    .sort((a, b) => (b.values[latestIndex] ?? 0) - (a.values[latestIndex] ?? 0))
  const activeSeries =
    visibleSeries.find((item) => item.id === activeLine) ?? visibleSeries[0]
  const latest = activeSeries?.values[latestIndex] ?? null
  const previous = activeSeries?.values[latestIndex - 1] ?? null
  const change =
    latest !== null && previous !== null
      ? ((latest - previous) / previous) * 100
      : null

  const selectRegion = (region: string) => {
    setSelectedRegion(region)
    if (region === "전체") {
      setActiveLine(regionSeries[0].id)
    } else {
      const first = locations.find((item) => item.region === region)
      if (first) setActiveLine(first.id)
    }
  }

  const downloadCsv = async () => {
    const response = await fetch("/data/carbon-monoxide-monthly-city.csv")
    const blob = await response.blob()
    const link = document.createElement("a")
    link.href = URL.createObjectURL(blob)
    link.download = "일산화탄소_월별_도시별_대기오염도.csv"
    link.click()
    URL.revokeObjectURL(link.href)
  }

  return (
    <div className="air-app">
      <header className="site-header">
        <a className="logo" href="#top" aria-label="에어라인 홈">
          <span className="logo-icon">
            <Icon name="wind" size={22} />
          </span>
          <span>AIRLINE</span>
        </a>
        <nav aria-label="주요 메뉴">
          <a className="nav-link active" href="#overview">
            데이터
          </a>
          <a className="nav-link" href="#regions">
            지역 탐색
          </a>
          <a className="nav-link" href="#about">
            데이터 안내
          </a>
        </nav>
        <button className="header-download" onClick={downloadCsv}>
          <Icon name="download" size={17} /> CSV
        </button>
      </header>

      <main id="top">
        <section className="hero" id="overview">
          <div className="hero-copy">
            <div className="overline">
              <span /> KOREA AIR QUALITY ARCHIVE
            </div>
            <h1>
              보이지 않는 공기를
              <br />
              선으로 읽습니다.
            </h1>
            <p>
              전국 시도와 시군구의 일산화탄소 농도 변화를
              <br />
              하나의 흰 선으로 명확하게 비교하세요.
            </p>
          </div>
          <div className="hero-stat">
            <span>최신 전국 평균</span>
            <strong>{nationalAverage[latestIndex].toFixed(2)}</strong>
            <small>PPM · {formatPeriod(periods[latestIndex])}</small>
          </div>
        </section>

        <section className="control-bar" id="regions">
          <div className="view-switch">
            <button
              className={selectedRegion === "전체" ? "selected" : ""}
              onClick={() => selectRegion("전체")}
            >
              전국 시도
            </button>
            <span>/</span>
            <span>
              {selectedRegion === "전체"
                ? "시도를 선택하세요"
                : `${shortRegion[selectedRegion] ?? selectedRegion} 시군구`}
            </span>
          </div>
          <div className="select-group">
            <label>
              <span>시도 선택</span>
              <select
                value={selectedRegion}
                onChange={(event) => selectRegion(event.target.value)}
              >
                <option value="전체">전국 시도 비교</option>
                {regionOrder.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>
            {selectedRegion !== "전체" && (
              <label>
                <span>시군구 강조</span>
                <select
                  value={activeSeries?.id}
                  onChange={(event) => setActiveLine(event.target.value)}
                >
                  {districtSeries.map((district) => (
                    <option key={district.id} value={district.id}>
                      {district.label}
                    </option>
                  ))}
                </select>
              </label>
            )}
          </div>
        </section>

        <section className="chart-section">
          <div className="section-head">
            <div>
              <span className="section-number">01</span>
              <div>
                <h2>
                  {selectedRegion === "전체"
                    ? "시도별 월간 추이"
                    : `${selectedRegion} 시군구별 월간 추이`}
                </h2>
                <p>월평균 일산화탄소 농도 · 단위 ppm</p>
              </div>
            </div>
            <div className="active-key">
              <span className="white-line" />
              <b>{activeSeries?.label}</b>
            </div>
          </div>

          <LineChart
            series={visibleSeries}
            activeId={activeSeries?.id ?? ""}
            onActive={setActiveLine}
          />

          <div className="series-legend">
            {visibleSeries.map((item) => (
              <button
                key={item.id}
                className={item.id === activeSeries?.id ? "active" : ""}
                onClick={() => setActiveLine(item.id)}
              >
                <span /> {item.label}
              </button>
            ))}
          </div>
        </section>

        <section className="metrics">
          <article>
            <span>선택 지역 최신 농도</span>
            <strong>
              {formatValue(latest)} <small>ppm</small>
            </strong>
            <p>
              {activeSeries?.label} · {formatPeriod(periods[latestIndex])}
            </p>
          </article>
          <article>
            <span>직전 관측월 대비</span>
            <strong>
              {change === null
                ? "—"
                : `${change > 0 ? "+" : ""}${change.toFixed(1)}`}{" "}
              <small>{change === null ? "" : "%"}</small>
            </strong>
            <p>{change !== null && change <= 0 ? "농도 감소" : "농도 증가"}</p>
          </article>
          <article>
            <span>현재 최고 지역</span>
            <strong>{latestRanking[0]?.label ?? "—"}</strong>
            <p>{formatValue(latestRanking[0]?.values[latestIndex])} ppm</p>
          </article>
          <article>
            <span>비교 지역 수</span>
            <strong>
              {visibleSeries.length} <small>개</small>
            </strong>
            <p>
              {selectedRegion === "전체"
                ? "전국 17개 시도"
                : `${selectedRegion} 상세 지역`}
            </p>
          </article>
        </section>

        <section className="ranking-section">
          <div className="section-head">
            <div>
              <span className="section-number">02</span>
              <div>
                <h2>
                  {selectedRegion === "전체"
                    ? "시도별 최신 농도"
                    : "시군구별 최신 농도"}
                </h2>
                <p>{formatPeriod(periods[latestIndex])} 관측값 기준</p>
              </div>
            </div>
          </div>
          <div className="ranking-table">
            {latestRanking.slice(0, 8).map((item, index) => {
              const value = item.values[latestIndex] ?? 0
              const max = latestRanking[0]?.values[latestIndex] ?? 1
              return (
                <button key={item.id} onClick={() => setActiveLine(item.id)}>
                  <span className="rank">
                    {String(index + 1).padStart(2, "0")}
                  </span>
                  <b>{item.label}</b>
                  <span className="bar">
                    <i style={{ width: `${(value / max) * 100}%` }} />
                  </span>
                  <strong>{value.toFixed(2)}</strong>
                  <Icon name="chevron" size={15} />
                </button>
              )
            })}
          </div>
        </section>

        <section className="about-strip" id="about">
          <Icon name="info" size={21} />
          <p>
            첨부 통계표 「일산화탄소 월별 도시별 대기오염도」를 기반으로 시도
            값은 해당 지역의 시군구 관측값 평균으로 계산했습니다.
          </p>
          <span>2024.11 — 2025.08</span>
        </section>
      </main>

      <footer>
        <span>AIRLINE · KOREA AIR QUALITY DATA</span>
        <span>DATA UNIT PPM</span>
      </footer>
    </div>
  )
}

export default App
