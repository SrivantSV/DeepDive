'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import {
    ArrowLeft,
    TrendingUp,
    DollarSign,
    Percent,
    BarChart3,
    Calculator,
    Home,
    AlertTriangle,
    CheckCircle2,
    XCircle,
    Loader2,
    RefreshCw
} from 'lucide-react'

// --- Types ---

interface PropertyData {
    address: string
    city: string
    state: string
    zipCode: string
    estimatedValue: number | null
    beds: number | null
    baths: number | null
    sqft: number | null
    yearBuilt: number | null
    propertyType: string | null
}

interface InvestmentInputs {
    purchasePrice: number
    monthlyRent: number
    annualPropertyTax: number
    annualInsurance: number
    annualMaintenance: number
    annualPropertyManagement: number
    downPaymentPercent: number
    mortgageRate: number
    loanTermYears: number
    occupancyRate: number
}

interface MetricResult {
    value: number
    color: 'green' | 'yellow' | 'red'
    label: string
    description: string
}

interface InvestmentResults {
    capRate: MetricResult
    onePercentRule: MetricResult
    dscr: MetricResult
    cashOnCash: MetricResult
    overallScore: 'STRONG BUY' | 'HOLD/NEUTRAL' | 'AVOID'
    overallColor: 'green' | 'yellow' | 'red'
    noi: number
    annualCashFlow: number
    monthlyPayment: number
}

// --- Calculation Functions ---

function calculateInvestmentMetrics(inputs: InvestmentInputs): InvestmentResults {
    const {
        purchasePrice,
        monthlyRent,
        annualPropertyTax,
        annualInsurance,
        annualMaintenance,
        annualPropertyManagement,
        downPaymentPercent,
        mortgageRate,
        loanTermYears,
        occupancyRate
    } = inputs

    // Gross Potential Income
    const annualGrossRent = monthlyRent * 12

    // Effective Gross Income (with vacancy)
    const effectiveGrossIncome = annualGrossRent * occupancyRate

    // Total Operating Expenses
    const totalOpEx = annualPropertyTax + annualInsurance + annualMaintenance + annualPropertyManagement

    // Net Operating Income
    const noi = effectiveGrossIncome - totalOpEx

    // CAP Rate
    const capRate = (noi / purchasePrice) * 100

    // 1% Rule
    const onePercentRule = (monthlyRent / purchasePrice) * 100

    // Mortgage Calculation
    const loanAmount = purchasePrice * (1 - downPaymentPercent)
    const monthlyRate = mortgageRate / 12
    const numberOfPayments = loanTermYears * 12

    let monthlyPayment = 0
    if (monthlyRate > 0 && loanAmount > 0) {
        monthlyPayment = loanAmount *
            (monthlyRate * Math.pow(1 + monthlyRate, numberOfPayments)) /
            (Math.pow(1 + monthlyRate, numberOfPayments) - 1)
    }

    const annualDebtService = monthlyPayment * 12

    // DSCR
    const dscr = annualDebtService > 0 ? noi / annualDebtService : 0

    // Cash-on-Cash Return
    const downPaymentAmount = purchasePrice * downPaymentPercent
    const closingCosts = purchasePrice * 0.03
    const cashInvested = downPaymentAmount + closingCosts
    const annualCashFlow = noi - annualDebtService
    const cashOnCash = cashInvested > 0 ? (annualCashFlow / cashInvested) * 100 : 0

    // Color scoring
    const capRateColor = capRate > 6 ? 'green' : capRate >= 4 ? 'yellow' : 'red'
    const onePercentColor = onePercentRule > 1.0 ? 'green' : onePercentRule >= 0.8 ? 'yellow' : 'red'
    const dscrColor = dscr > 1.25 ? 'green' : dscr >= 1.1 ? 'yellow' : 'red'
    const cashOnCashColor = cashOnCash > 8 ? 'green' : cashOnCash >= 5 ? 'yellow' : 'red'

    // Overall score
    const colors = [capRateColor, onePercentColor, dscrColor, cashOnCashColor]
    const greenCount = colors.filter(c => c === 'green').length
    const redCount = colors.filter(c => c === 'red').length

    let overallScore: 'STRONG BUY' | 'HOLD/NEUTRAL' | 'AVOID'
    let overallColor: 'green' | 'yellow' | 'red'

    if (greenCount >= 3) {
        overallScore = 'STRONG BUY'
        overallColor = 'green'
    } else if (redCount >= 2) {
        overallScore = 'AVOID'
        overallColor = 'red'
    } else {
        overallScore = 'HOLD/NEUTRAL'
        overallColor = 'yellow'
    }

    return {
        capRate: {
            value: capRate,
            color: capRateColor,
            label: 'CAP Rate',
            description: capRate > 6 ? 'Excellent income potential' : capRate >= 4 ? 'Acceptable returns' : 'Weak returns'
        },
        onePercentRule: {
            value: onePercentRule,
            color: onePercentColor,
            label: '1% Rule',
            description: onePercentRule > 1 ? 'Strong cash flow indicator' : onePercentRule >= 0.8 ? 'Meets minimum threshold' : 'Weak income potential'
        },
        dscr: {
            value: dscr,
            color: dscrColor,
            label: 'DSCR',
            description: dscr > 1.25 ? 'Healthy 25%+ buffer' : dscr >= 1.1 ? 'Tight but workable' : 'Insufficient cushion'
        },
        cashOnCash: {
            value: cashOnCash,
            color: cashOnCashColor,
            label: 'Cash-on-Cash',
            description: cashOnCash > 8 ? 'Excellent first year return' : cashOnCash >= 5 ? 'Solid investment' : 'Poor first year returns'
        },
        overallScore,
        overallColor,
        noi,
        annualCashFlow,
        monthlyPayment
    }
}

// --- Helper Components ---

function MetricCard({ metric, formatValue }: { metric: MetricResult; formatValue: string }) {
    const colorClasses = {
        green: 'bg-emerald-50 border-emerald-200 text-emerald-700',
        yellow: 'bg-amber-50 border-amber-200 text-amber-700',
        red: 'bg-red-50 border-red-200 text-red-700'
    }

    const iconClasses = {
        green: 'text-emerald-500',
        yellow: 'text-amber-500',
        red: 'text-red-500'
    }

    const Icon = metric.color === 'green' ? CheckCircle2 : metric.color === 'yellow' ? AlertTriangle : XCircle

    return (
        <div className={`rounded-2xl border-2 p-6 ${colorClasses[metric.color]} transition-all hover:shadow-lg`}>
            <div className="flex items-start justify-between mb-4">
                <h3 className="text-sm font-bold uppercase tracking-wider opacity-70">{metric.label}</h3>
                <Icon className={`w-6 h-6 ${iconClasses[metric.color]}`} />
            </div>
            <div className="text-3xl font-bold mb-2">{formatValue}</div>
            <p className="text-sm opacity-80">{metric.description}</p>
        </div>
    )
}

function InputField({
    label,
    value,
    onChange,
    prefix,
    suffix,
    step = 1
}: {
    label: string
    value: number
    onChange: (val: number) => void
    prefix?: string
    suffix?: string
    step?: number
}) {
    return (
        <div>
            <label className="block text-sm font-medium text-slate-700 mb-1">{label}</label>
            <div className="relative">
                {prefix && (
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">{prefix}</span>
                )}
                <input
                    type="number"
                    value={value}
                    onChange={(e) => onChange(parseFloat(e.target.value) || 0)}
                    step={step}
                    className={`w-full rounded-xl border border-slate-200 py-3 ${prefix ? 'pl-8' : 'pl-4'} ${suffix ? 'pr-12' : 'pr-4'
                        } focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 transition-all`}
                />
                {suffix && (
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400">{suffix}</span>
                )}
            </div>
        </div>
    )
}

// --- Main Content Component ---

function InvestorCheckContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const query = searchParams.get('q')

    const [property, setProperty] = useState<PropertyData | null>(null)
    const [loading, setLoading] = useState(true)
    const [results, setResults] = useState<InvestmentResults | null>(null)
    const [showInputs, setShowInputs] = useState(false)

    // Investment inputs with defaults
    const [inputs, setInputs] = useState<InvestmentInputs>({
        purchasePrice: 500000,
        monthlyRent: 2500,
        annualPropertyTax: 6000,
        annualInsurance: 1500,
        annualMaintenance: 5000,
        annualPropertyManagement: 3000,
        downPaymentPercent: 0.20,
        mortgageRate: 0.07,
        loanTermYears: 30,
        occupancyRate: 0.95
    })

    useEffect(() => {
        if (query) {
            fetchProperty(query)
        } else {
            setLoading(false)
        }
    }, [query])

    useEffect(() => {
        // Recalculate when inputs change
        if (inputs.purchasePrice > 0) {
            const calculated = calculateInvestmentMetrics(inputs)
            setResults(calculated)
        }
    }, [inputs])

    const fetchProperty = async (address: string) => {
        try {
            const response = await fetch(`/api/analyze?q=${encodeURIComponent(address)}`)
            const result = await response.json()
            if (result.data) {
                setProperty(result.data)

                // Update inputs with property data
                const estimatedValue = result.data.estimatedValue || 500000
                const estimatedRent = estimatedValue * 0.005 // Rough estimate: 0.5% of value as monthly rent

                setInputs(prev => ({
                    ...prev,
                    purchasePrice: estimatedValue,
                    monthlyRent: Math.round(estimatedRent),
                    annualPropertyTax: Math.round(estimatedValue * 0.012), // ~1.2% of value
                    annualInsurance: Math.round(estimatedValue * 0.003), // ~0.3% of value
                    annualMaintenance: Math.round(estimatedValue * 0.01), // ~1% of value
                    annualPropertyManagement: Math.round(estimatedRent * 12 * 0.10) // 10% of rent
                }))
            }
        } catch (error) {
            console.error('Failed to fetch property:', error)
        } finally {
            setLoading(false)
        }
    }

    const updateInput = (key: keyof InvestmentInputs, value: number) => {
        setInputs(prev => ({ ...prev, [key]: value }))
    }

    if (!query) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="text-center max-w-md">
                    <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <TrendingUp className="w-10 h-10 text-emerald-600" />
                    </div>
                    <h1 className="text-2xl font-bold text-slate-900 mb-3">Investment Analysis</h1>
                    <p className="text-slate-600 mb-6">Enter a property address to analyze its investment potential.</p>
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 px-6 py-3 bg-emerald-600 text-white font-semibold rounded-xl hover:bg-emerald-700 transition-colors"
                    >
                        <Home className="w-5 h-5" />
                        Go to Homepage
                    </Link>
                </div>
            </div>
        )
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <div className="text-center">
                    <Loader2 className="w-12 h-12 text-emerald-600 animate-spin mx-auto mb-4" />
                    <p className="text-slate-600">Analyzing investment potential...</p>
                </div>
            </div>
        )
    }

    return (
        <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
            {/* Header */}
            <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
                <div className="max-w-6xl mx-auto px-4 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Link
                            href="/"
                            className="p-2 hover:bg-slate-100 rounded-xl transition-colors"
                        >
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Link>
                        <div>
                            <div className="flex items-center gap-2">
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-700 text-xs font-bold uppercase rounded-full tracking-wider">
                                    Investor Check
                                </span>
                            </div>
                            <h1 className="text-lg font-bold text-slate-900 mt-1">
                                {property?.address || query}
                            </h1>
                        </div>
                    </div>
                    <button
                        onClick={() => setShowInputs(!showInputs)}
                        className="flex items-center gap-2 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-medium rounded-xl transition-colors"
                    >
                        <Calculator className="w-4 h-4" />
                        {showInputs ? 'Hide' : 'Edit'} Assumptions
                    </button>
                </div>
            </header>

            <main className="max-w-6xl mx-auto px-4 py-8">
                {/* Overall Score */}
                {results && (
                    <div className={`rounded-3xl p-8 mb-8 text-center ${results.overallColor === 'green'
                        ? 'bg-gradient-to-br from-emerald-500 to-teal-600 text-white'
                        : results.overallColor === 'red'
                            ? 'bg-gradient-to-br from-red-500 to-rose-600 text-white'
                            : 'bg-gradient-to-br from-amber-400 to-orange-500 text-white'
                        }`}
                    >
                        <div className="text-sm font-bold uppercase tracking-wider opacity-80 mb-2">
                            Overall Investment Score
                        </div>
                        <div className="text-5xl font-black mb-4">
                            {results.overallScore === 'STRONG BUY' && '✓✓✓ '}
                            {results.overallScore === 'AVOID' && '✗✗ '}
                            {results.overallScore === 'HOLD/NEUTRAL' && '◐◐ '}
                            {results.overallScore}
                        </div>
                        <div className="flex flex-wrap justify-center gap-6 text-sm opacity-90">
                            <div>
                                <span className="font-bold">${results.noi.toLocaleString()}</span> NOI/year
                            </div>
                            <div>
                                <span className="font-bold">${results.annualCashFlow.toLocaleString()}</span> Cash Flow/year
                            </div>
                            <div>
                                <span className="font-bold">${Math.round(results.monthlyPayment).toLocaleString()}</span> Mortgage/month
                            </div>
                        </div>
                    </div>
                )}

                {/* Editable Inputs Panel */}
                {showInputs && (
                    <div className="bg-white rounded-2xl border border-slate-200 p-6 mb-8 shadow-sm">
                        <h2 className="text-lg font-bold text-slate-900 mb-4 flex items-center gap-2">
                            <Calculator className="w-5 h-5 text-slate-600" />
                            Investment Assumptions
                        </h2>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            <InputField
                                label="Purchase Price"
                                value={inputs.purchasePrice}
                                onChange={(v) => updateInput('purchasePrice', v)}
                                prefix="$"
                            />
                            <InputField
                                label="Monthly Rent"
                                value={inputs.monthlyRent}
                                onChange={(v) => updateInput('monthlyRent', v)}
                                prefix="$"
                            />
                            <InputField
                                label="Down Payment %"
                                value={inputs.downPaymentPercent * 100}
                                onChange={(v) => updateInput('downPaymentPercent', v / 100)}
                                suffix="%"
                                step={5}
                            />
                            <InputField
                                label="Mortgage Rate"
                                value={inputs.mortgageRate * 100}
                                onChange={(v) => updateInput('mortgageRate', v / 100)}
                                suffix="%"
                                step={0.25}
                            />
                            <InputField
                                label="Annual Property Tax"
                                value={inputs.annualPropertyTax}
                                onChange={(v) => updateInput('annualPropertyTax', v)}
                                prefix="$"
                            />
                            <InputField
                                label="Annual Insurance"
                                value={inputs.annualInsurance}
                                onChange={(v) => updateInput('annualInsurance', v)}
                                prefix="$"
                            />
                            <InputField
                                label="Annual Maintenance"
                                value={inputs.annualMaintenance}
                                onChange={(v) => updateInput('annualMaintenance', v)}
                                prefix="$"
                            />
                            <InputField
                                label="Annual Property Mgmt"
                                value={inputs.annualPropertyManagement}
                                onChange={(v) => updateInput('annualPropertyManagement', v)}
                                prefix="$"
                            />
                            <InputField
                                label="Occupancy Rate"
                                value={inputs.occupancyRate * 100}
                                onChange={(v) => updateInput('occupancyRate', v / 100)}
                                suffix="%"
                                step={5}
                            />
                        </div>
                    </div>
                )}

                {/* 4 Metric Cards */}
                {results && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                        <MetricCard
                            metric={results.capRate}
                            formatValue={`${results.capRate.value.toFixed(2)}%`}
                        />
                        <MetricCard
                            metric={results.onePercentRule}
                            formatValue={`${results.onePercentRule.value.toFixed(2)}%`}
                        />
                        <MetricCard
                            metric={results.dscr}
                            formatValue={`${results.dscr.value.toFixed(2)}x`}
                        />
                        <MetricCard
                            metric={results.cashOnCash}
                            formatValue={`${results.cashOnCash.value.toFixed(2)}%`}
                        />
                    </div>
                )}

                {/* Legend */}
                <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-4">Understanding the Metrics</h3>
                    <div className="grid md:grid-cols-2 gap-6 text-sm text-slate-600">
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-1">CAP Rate (Capitalization Rate)</h4>
                            <p>Annual net income as % of purchase price. Higher is better for income investors.</p>
                            <p className="mt-1 text-xs">🟢 &gt;6% | 🟡 4-6% | 🔴 &lt;4%</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-1">1% Rule (Quick Indicator)</h4>
                            <p>Monthly rent should be 1%+ of property price for good cash flow.</p>
                            <p className="mt-1 text-xs">🟢 &gt;1.0% | 🟡 0.8-1.0% | 🔴 &lt;0.8%</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-1">DSCR (Debt Service Coverage) ⭐</h4>
                            <p>How many times NOI covers debt payments. Most important metric for lenders.</p>
                            <p className="mt-1 text-xs">🟢 &gt;1.25x | 🟡 1.1-1.25x | 🔴 &lt;1.1x</p>
                        </div>
                        <div>
                            <h4 className="font-semibold text-slate-800 mb-1">Cash-on-Cash Return</h4>
                            <p>First year ROI based on actual cash invested (down payment + closing).</p>
                            <p className="mt-1 text-xs">🟢 &gt;8% | 🟡 5-8% | 🔴 &lt;5%</p>
                        </div>
                    </div>
                </div>

                {/* Back to Deep Dive Link */}
                <div className="mt-8 text-center">
                    <Link
                        href={`/deep-dive?q=${encodeURIComponent(query || '')}`}
                        className="inline-flex items-center gap-2 text-blue-600 hover:text-blue-800 font-medium"
                    >
                        Want more details? Try a Deep Dive analysis
                        <ArrowLeft className="w-4 h-4 rotate-180" />
                    </Link>
                </div>
            </main>
        </div>
    )
}

// --- Page Component with Suspense ---

export default function InvestorCheckPage() {
    return (
        <Suspense fallback={
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center">
                <Loader2 className="w-12 h-12 text-emerald-600 animate-spin" />
            </div>
        }>
            <InvestorCheckContent />
        </Suspense>
    )
}
