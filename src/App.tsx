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
  name: "wind" | "download" | "arrow" | "info" | "chevron" | "sensor"
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
    sensor: (
      <>
        <circle cx="12" cy="12" r="2" />
        <path d="M7.75 7.75a6 6 0 0 0 0 8.5m8.5-8.5a6 6 0 0 1 0 8.5" />
        <path d="M4.9 4.9a10 10 0 0 0 0 14.2m14.2-14.2a10 10 0 0 1 0 14.2" />
      </>
    ),
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

const sensorSamples = {
  "1시간": {
    labels: [
      "14:00",
      "14:05",
      "14:10",
      "14:15",
      "14:20",
      "14:25",
      "14:30",
      "14:35",
      "14:40",
      "14:45",
      "14:50",
      "14:55",
      "15:00",
    ],
    values: [
      45.2, 44.8, 46.1, 43.7, 42.9, 44.3, 41.8, 40.6, 41.2, 43.5, 42.1, 43.2,
      42.8,
    ],
  },
  "6시간": {
    labels: [
      "09:00",
      "09:30",
      "10:00",
      "10:30",
      "11:00",
      "11:30",
      "12:00",
      "12:30",
      "13:00",
      "13:30",
      "14:00",
      "14:30",
      "15:00",
    ],
    values: [
      52.4, 49.8, 47.2, 48.6, 45.1, 43.9, 46.5, 44.2, 41.7, 40.9, 44.8, 41.3,
      42.8,
    ],
  },
  "24시간": {
    labels: [
      "15시",
      "17시",
      "19시",
      "21시",
      "23시",
      "01시",
      "03시",
      "05시",
      "07시",
      "09시",
      "11시",
      "13시",
      "15시",
    ],
    values: [
      61.4, 58.2, 55.6, 51.8, 49.2, 47.5, 46.1, 44.8, 48.7, 52.4, 45.1, 41.7,
      42.8,
    ],
  },
}

type SensorRange = keyof typeof sensorSamples

function SensorChart({
  labels,
  values,
}: {
  labels: string[]
  values: number[]
}) {
  const width = 1050
  const height = 390
  const margin = { top: 35, right: 25, bottom: 50, left: 58 }
  const min = Math.floor((Math.min(...values) - 5) / 10) * 10
  const max = Math.ceil((Math.max(...values) + 5) / 10) * 10
  const x = (index: number) =>
    margin.left +
    index * ((width - margin.left - margin.right) / (values.length - 1))
  const y = (value: number) =>
    margin.top +
    ((max - value) / (max - min)) * (height - margin.top - margin.bottom)
  const points = values
    .map((value, index) => `${x(index)},${y(value)}`)
    .join(" ")
  const area = `${margin.left},${height - margin.bottom} ${points} ${width - margin.right},${height - margin.bottom}`
  const ticks = Array.from(
    { length: 5 },
    (_, index) => min + ((max - min) / 4) * index,
  )

  return (
    <div className="sensor-chart-wrap">
      <svg
        className="sensor-chart"
        viewBox={`0 0 ${width} ${height}`}
        role="img"
        aria-label="시간에 따른 초음파 거리 센서 값"
      >
        <defs>
          <linearGradient id="sensor-area" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#ffffff" stopOpacity=".12" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </linearGradient>
        </defs>
        {ticks.map((tick) => (
          <g key={tick}>
            <line
              className="sensor-grid"
              x1={margin.left}
              x2={width - margin.right}
              y1={y(tick)}
              y2={y(tick)}
            />
            <text
              className="sensor-axis"
              x={margin.left - 15}
              y={y(tick) + 4}
              textAnchor="end"
            >
              {tick.toFixed(0)}
            </text>
          </g>
        ))}
        {labels.map((label, index) => (
          <text
            className="sensor-axis"
            key={`${label}-${index}`}
            x={x(index)}
            y={height - 18}
            textAnchor="middle"
          >
            {index % 2 === 0 ? label : ""}
          </text>
        ))}
        <polygon points={area} fill="url(#sensor-area)" />
        <polyline className="sensor-line" points={points} />
        {values.map((value, index) => (
          <circle
            key={`${labels[index]}-${index}`}
            className={`sensor-point ${
              index === values.length - 1 ? "latest" : ""
            }`}
            cx={x(index)}
            cy={y(value)}
            r={index === values.length - 1 ? 5 : 2.8}
          />
        ))}
      </svg>
    </div>
  )
}

function SensorDashboard() {
  const [range, setRange] = useState<SensorRange>("1시간")
  const data = sensorSamples[range]
  const current = data.values.at(-1) ?? 0
  const average =
    data.values.reduce((sum, value) => sum + value, 0) / data.values.length
  const min = Math.min(...data.values)
  const max = Math.max(...data.values)

  return (
    <main className="sensor-main">
      <section className="sensor-heading">
        <div>
          <div className="overline">
            <span /> ULTRASONIC DISTANCE MONITOR
          </div>
          <h1>초음파 거리 센서</h1>
          <p>센서와 물체 사이의 거리를 실시간으로 모니터링합니다.</p>
        </div>
        <div className="live-status">
          <i /> LIVE <span>예시 데이터</span>
        </div>
      </section>

      <section className="sensor-overview">
        <article className="current-sensor-card">
          <div className="card-label">
            <span>현재 거리</span>
            <div className="sensor-glyph">
              <Icon name="sensor" size={25} />
            </div>
          </div>
          <div className="current-reading">
            <strong>{current.toFixed(1)}</strong>
            <span>cm</span>
          </div>
          <div className="distance-visual" aria-hidden="true">
            <span className="device-mark">
              <i />
              <i />
            </span>
            <span className="distance-rule">
              <i />
            </span>
            <span className="object-mark" />
          </div>
          <div className="reading-foot">
            <span>정상 범위</span>
            <span>마지막 갱신 · 방금 전</span>
          </div>
        </article>

        <article className="sensor-graph-panel">
          <div className="sensor-panel-head">
            <div>
              <span className="section-number">01</span>
              <h2>거리 변화</h2>
              <p>시간에 따른 측정 거리 · 단위 cm</p>
            </div>
            <div className="range-tabs">
              {(Object.keys(sensorSamples) as SensorRange[]).map((item) => (
                <button
                  key={item}
                  className={range === item ? "active" : ""}
                  onClick={() => setRange(item)}
                >
                  {item}
                </button>
              ))}
            </div>
          </div>
          <SensorChart labels={data.labels} values={data.values} />
        </article>
      </section>

      <section className="sensor-metrics">
        <article>
          <span>평균 거리</span>
          <strong>
            {average.toFixed(1)} <small>cm</small>
          </strong>
          <p>선택 구간 평균</p>
        </article>
        <article>
          <span>최소 거리</span>
          <strong>
            {min.toFixed(1)} <small>cm</small>
          </strong>
          <p>가장 가까운 측정값</p>
        </article>
        <article>
          <span>최대 거리</span>
          <strong>
            {max.toFixed(1)} <small>cm</small>
          </strong>
          <p>가장 먼 측정값</p>
        </article>
        <article>
          <span>측정 주기</span>
          <strong>
            5 <small>sec</small>
          </strong>
          <p>예시 수집 간격</p>
        </article>
      </section>

      <section className="sensor-note">
        <Icon name="info" size={20} />
        <div>
          <b>데이터 연결 전 미리보기</b>
          <p>
            현재 표시되는 값은 화면 구성을 위한 예시입니다. 센서 API 연결 시
            동일한 영역에 실시간 데이터가 반영됩니다.
          </p>
        </div>
        <span>HC-SR04 / MOCK</span>
      </section>
    </main>
  )
}

function App() {
  const [view, setView] = useState<"air" | "sensor">("air")
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
        <button
          className="logo"
          onClick={() => setView("air")}
          aria-label="에어라인 홈"
        >
          <span className="logo-icon">
            <Icon name="wind" size={22} />
          </span>
          <span>AIRLINE</span>
        </button>
        <nav aria-label="주요 메뉴">
          <button
            className={`nav-link ${view === "air" ? "active" : ""}`}
            onClick={() => setView("air")}
          >
            대기 데이터
          </button>
          <button
            className={`nav-link ${view === "sensor" ? "active" : ""}`}
            onClick={() => setView("sensor")}
          >
            초음파 센서
          </button>
          {view === "air" && (
            <a className="nav-link" href="#regions">
              지역 탐색
            </a>
          )}
        </nav>
        {view === "air" ? (
          <button className="header-download" onClick={downloadCsv}>
            <Icon name="download" size={17} /> CSV
          </button>
        ) : (
          <span className="mock-badge">MOCK DATA</span>
        )}
      </header>

      {view === "air" ? (
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
              <p>
                {change !== null && change <= 0 ? "농도 감소" : "농도 증가"}
              </p>
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
      ) : (
        <SensorDashboard />
      )}

      <footer>
        <span>AIRLINE · ENVIRONMENTAL DATA SYSTEM</span>
        <span>{view === "air" ? "DATA UNIT PPM" : "SENSOR UNIT CM"}</span>
      </footer>
    </div>
  )
}

export default App
