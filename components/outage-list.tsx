"use client"

import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, Zap, BatteryLow, Trash2, MoreVertical } from "lucide-react"
import type { OutageReport } from "@/components/outage-reporter"
import { Label } from "./ui/label"
import { Button } from "./ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useState, useCallback, useEffect } from "react"
import { toast } from "sonner"
import { useDeletedReports } from "@/hooks/use-deleted-reports"

interface OutageListProps {
  reports: OutageReport[]
  setReports: (reports: OutageReport[]) => void
}

export default function OutageList({ reports, setReports }: OutageListProps) {
  const [reportToDelete, setReportToDelete] = useState<string | null>(null)
  const [deletedReports, addDeletedReport, removeDeletedReport] = useDeletedReports()

  useEffect(() => {
    const timer = setTimeout(() => {
      window.dispatchEvent(new Event("resize"))
    }, 200)

    return () => clearTimeout(timer)
  }, [reports])

  const handleDelete = (reportId: string) => {
    setReportToDelete(reportId)
  }

  const confirmDelete = useCallback(() => {
    if (reportToDelete) {
      const reportToRemove = reports.find((report) => report.id === reportToDelete)
      if (reportToRemove) {
        addDeletedReport(reportToDelete, reportToRemove)

        const updatedReports = reports.filter((report) => report.id !== reportToDelete)
        setReports(updatedReports)

        toast("Report deleted", {
          action: {
            label: "Undo",
            onClick: () => {
              const restored = undoDelete(reportToDelete)
              if (!restored) {
                toast.error("Could not restore report")
              }
            },
          },
          duration: 5000,
        })
      }
      setReportToDelete(null)
    }
  }, [reportToDelete, reports, addDeletedReport, setReports])

  const undoDelete = useCallback(
    (reportId: string): boolean => {
      const deletedReport = removeDeletedReport(reportId)
      if (deletedReport) {
        setReports((prevReports) => {
          const exists = prevReports.some((report) => report.id === deletedReport.id)
          if (exists) {
            return prevReports
          }
          return [deletedReport, ...prevReports]
        })
        toast("Report restored")
        return true
      }
      return false
    },
    [removeDeletedReport, setReports],
  )

  const cancelDelete = () => {
    setReportToDelete(null)
  }

  return (
    <div className="overflow-y-auto overscroll-contain lg:max-h-[calc(100vh-150px)] pr-2 custom-scrollbar">
      {reports.length > 0 ? (
        <div className="space-y-3 pb-2">
          {reports.map((report) => (
            <Card key={report.id} className="min-h-[120px] flex flex-col">
              <CardHeader className="flex flex-row items-center justify-between p-3 pb-1">
                <CardTitle className="text-base font-semibold">
                  {report.severity === "critical" && (
                    <span className="flex items-center gap-1 text-red-500">
                      <AlertTriangle className="h-4 w-4" /> Critical Outage
                    </span>
                  )}
                  {report.severity === "major" && (
                    <span className="flex items-center gap-1 text-amber-500">
                      <Zap className="h-4 w-4" /> Major Outage
                    </span>
                  )}
                  {report.severity === "minor" && (
                    <span className="flex items-center gap-1 text-blue-500">
                      <BatteryLow className="h-4 w-4" /> Minor Outage
                    </span>
                  )}
                </CardTitle>
                <div className="flex items-center gap-1">
                  <Badge className="text-xs">{report.status}</Badge>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-7 w-7">
                        <MoreVertical className="h-3 w-3" />
                        <span className="sr-only">Actions</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem
                        onClick={() => handleDelete(report.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="flex-1 py-1 px-3">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Address</Label>
                  <p className="text-xs break-words">{report.address}</p>
                </div>
                <div className="space-y-0 mt-1">
                  <Label className="text-xs text-muted-foreground">Description</Label>
                  <p className="text-xs break-words">{report.description || "No description provided"}</p>
                </div>
                <div className="space-y-0 mt-1">
                  <Label className="text-xs text-muted-foreground">Date</Label>
                  <p className="text-xs">{new Date(report.timestamp).toLocaleString()}</p>
                </div>
              </CardContent>
              <CardFooter className="pt-0 pb-2 px-3">
                <Link href={`/report/${report.id}`} className="text-xs text-primary hover:underline">
                  View Details
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-sm text-muted-foreground">No reports available.</div>
      )}

      <AlertDialog open={reportToDelete !== null} onOpenChange={(open) => !open && setReportToDelete(null)}>
        <AlertDialogContent className="mx-0">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the outage report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={cancelDelete}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}