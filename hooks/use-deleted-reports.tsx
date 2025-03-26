"use client"

import { useState, useEffect, useCallback } from "react"
import type { OutageReport } from "@/components/outage-reporter"

export function useDeletedReports(): [
  { [key: string]: OutageReport },
  (reportId: string, report: OutageReport) => void,
  (reportId: string) => OutageReport | null,
] {
  const [deletedReports, setDeletedReports] = useState<{ [key: string]: OutageReport }>({})
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)

    try {
      const storedDeletedReports = localStorage.getItem("deleted-reports")
      if (storedDeletedReports) {
        setDeletedReports(JSON.parse(storedDeletedReports))
      }
    } catch (error) {
      console.error("Error loading deleted reports:", error)
    }
  }, [])

  const addDeletedReport = useCallback((reportId: string, report: OutageReport) => {
    setDeletedReports((prev) => {
      const newDeletedReports = { ...prev, [reportId]: report }

      if (typeof window !== "undefined") {
        localStorage.setItem("deleted-reports", JSON.stringify(newDeletedReports))
      }

      return newDeletedReports
    })
  }, [])

  const removeDeletedReport = useCallback((reportId: string): OutageReport | null => {
    let removedReport: OutageReport | null = null

    setDeletedReports((prev) => {
      if (!prev[reportId]) return prev

      removedReport = prev[reportId]
      const newDeletedReports = { ...prev }
      delete newDeletedReports[reportId]

      if (typeof window !== "undefined") {
        localStorage.setItem("deleted-reports", JSON.stringify(newDeletedReports))
      }

      return newDeletedReports
    })

    return removedReport
  }, [])

  return [deletedReports, addDeletedReport, removeDeletedReport]
}

