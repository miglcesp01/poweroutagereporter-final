"use client"

import { useEffect, useState, useCallback } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { AlertTriangle, Zap, BatteryLow, Clock, MapPin, ArrowLeft, Edit, Trash2, Save, X } from "lucide-react"
import { useLocalStorage } from "@/hooks/use-local-storage"
import dynamic from "next/dynamic"
import type { OutageReport } from "@/components/outage-reporter"
import { toast } from "sonner"
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
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { useDeletedReports } from "@/hooks/use-deleted-reports"

const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-[300px] w-full flex items-center justify-center bg-gray-100 rounded-md">Loading map...</div>
  ),
})

const formSchema = z.object({
  address: z.string().min(1, { message: "Address is required" }),
  severity: z.enum(["critical", "major", "minor"], {
    required_error: "Please select a severity level",
  }),
  description: z.string().min(1, { message: "Description is required" }),
})

export default function ReportDetails() {
  const params = useParams()
  const id = typeof params.id === "string" ? params.id : Array.isArray(params.id) ? params.id[0] : ""
  const router = useRouter()
  const [reports, setReports] = useLocalStorage<OutageReport[]>("outage-reports", [])
  const [report, setReport] = useState<OutageReport | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [deletedReports, addDeletedReport, removeDeletedReport] = useDeletedReports()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      severity: "major",
      description: "",
    },
  })

  useEffect(() => {
    if (!id) return

    const foundReport = reports.find((r) => r.id === id)
    if (foundReport) {
      setReport(foundReport)
      setPosition(foundReport.location)

      form.reset({
        address: foundReport.address,
        severity: foundReport.severity,
        description: foundReport.description,
      })
    }
  }, [id, reports, form])

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setIsEditing(false)
    if (report) {
      form.reset({
        address: report.address,
        severity: report.severity,
        description: report.description,
      })
    }
  }

  const handleSaveEdit = (values: z.infer<typeof formSchema>) => {
    if (!report || !position) return

    const updatedReport: OutageReport = {
      ...report,
      address: values.address,
      severity: values.severity,
      description: values.description,
      location: position,
    }

    const updatedReports = reports.map((r) => (r.id === report.id ? updatedReport : r))

    setReports(updatedReports)
    setReport(updatedReport)
    setIsEditing(false)
    toast("Report updated")
  }

  const handleDelete = () => {
    setShowDeleteDialog(true)
  }

  const confirmDelete = useCallback(() => {
    if (report) {
      const reportId = report.id

      addDeletedReport(reportId, report)

      const updatedReports = reports.filter((r) => r.id !== reportId)
      setReports(updatedReports)

      toast("Report deleted", {
        action: {
          label: "Undo",
          onClick: () => {
            const restored = undoDelete(reportId)
            if (!restored) {
              toast.error("Could not restore report")
            }
          },
        },
        duration: 5000,
      })

      router.push("/")
    }
    setShowDeleteDialog(false)
  }, [report, reports, addDeletedReport, setReports, router])

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

        router.push(`/report/${reportId}`)
        return true
      }
      return false
    },
    [removeDeletedReport, setReports, router],
  )

  const setAddress = (address: string) => {
    form.setValue("address", address)
  }

  if (!report) {
    return (
      <div className="container mx-auto px-4 py-4">
        <Card>
          <CardContent className="pt-4">
            <p className="text-center text-muted-foreground">Report not found.</p>
            <div className="mt-4 flex justify-center">
              <Link href="/">
                <Button variant="outline">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  const getSeverityIcon = (severity: string) => {
    switch (severity) {
      case "critical":
        return <AlertTriangle className="h-4 w-4 text-red-500" />
      case "major":
        return <Zap className="h-4 w-4 text-amber-500" />
      case "minor":
        return <BatteryLow className="h-4 w-4 text-blue-500" />
      default:
        return null
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "reported":
        return (
          <Badge variant="outline" className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
            Reported
          </Badge>
        )
      case "investigating":
        return (
          <Badge variant="outline" className="bg-blue-100 text-blue-800 hover:bg-blue-100">
            Investigating
          </Badge>
        )
      case "resolved":
        return (
          <Badge variant="outline" className="bg-green-100 text-green-800 hover:bg-green-100">
            Resolved
          </Badge>
        )
      default:
        return null
    }
  }

  const formatDate = (timestamp: number) => {
    return new Date(timestamp).toLocaleString()
  }

  return (
    <main className="container mx-auto px-4 py-4 h-[calc(100vh-64px)] overflow-auto">
      <div className="mb-4 flex justify-between items-center">
        <Link href="/">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-1" />
            Back
          </Button>
        </Link>
        {!isEditing ? (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleEdit}>
              <Edit className="h-4 w-4 mr-1" />
              Edit
            </Button>
            <Button variant="outline" size="sm" onClick={handleDelete}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        ) : (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={handleCancelEdit}>
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
            <Button variant="default" size="sm" onClick={form.handleSubmit(handleSaveEdit)}>
              <Save className="h-4 w-4 mr-1" />
              Save
            </Button>
          </div>
        )}
      </div>

      <Card>
        <CardHeader className="p-4 pb-2">
          <div className="flex justify-between items-start">
            <div className="flex items-center gap-1">
              {!isEditing ? (
                <>
                  {getSeverityIcon(report.severity)}
                  <CardTitle className="text-xl capitalize">{report.severity} Outage</CardTitle>
                </>
              ) : (
                <CardTitle className="text-xl">Edit Outage Report</CardTitle>
              )}
            </div>
            {!isEditing && getStatusBadge(report.status)}
          </div>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-4">
          {!isEditing ? (
            <div className="space-y-3">
              <div className="flex items-start gap-2">
                <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                <p className="text-sm break-words">{report.address}</p>
              </div>

              {report.description && (
                <div>
                  <p className="text-sm font-medium">Description:</p>
                  <p className="text-sm text-muted-foreground break-words">{report.description}</p>
                </div>
              )}

              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <p className="text-xs text-muted-foreground">{formatDate(report.timestamp)}</p>
              </div>
            </div>
          ) : (
            <Form {...form}>
              <form className="space-y-3">
                <div className="space-y-3">
                  <div className="h-[250px] w-full rounded-md overflow-hidden border relative mb-3">
                    <MapComponent position={position} setPosition={setPosition} setAddress={setAddress} />
                  </div>

                  <FormField
                    control={form.control}
                    name="address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Address</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter your address" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="severity"
                    render={({ field }) => (
                      <FormItem className="space-y-1">
                        <FormLabel>Outage Severity</FormLabel>
                        <FormControl>
                          <RadioGroup onValueChange={field.onChange} value={field.value} className="space-y-1">
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="critical" id="edit-critical" />
                              </FormControl>
                              <FormLabel
                                htmlFor="edit-critical"
                                className="flex items-centerter gap-1 font-normal cursor-pointer"
                              >
                                <AlertTriangle className="h-4 w-4 text-red-500" />
                                Critical (No power, safety concern)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="major" id="edit-major" />
                              </FormControl>
                              <FormLabel
                                htmlFor="edit-major"
                                className="flex items-center gap-1 font-normal cursor-pointer"
                              >
                                <Zap className="h-4 w-4 text-amber-500" />
                                Major (Complete outage)
                              </FormLabel>
                            </FormItem>
                            <FormItem className="flex items-center space-x-2 space-y-0">
                              <FormControl>
                                <RadioGroupItem value="minor" id="edit-minor" />
                              </FormControl>
                              <FormLabel
                                htmlFor="edit-minor"
                                className="flex items-center gap-1 font-normal cursor-pointer"
                              >
                                <BatteryLow className="h-4 w-4 text-blue-500" />
                                Minor (Partial outage, flickering)
                              </FormLabel>
                            </FormItem>
                          </RadioGroup>
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description</FormLabel>
                        <FormControl>
                          <Textarea placeholder="Provide any additional details about the outage" rows={2} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </form>
            </Form>
          )}

          {!isEditing && (
            <div className="h-[250px] w-full rounded-md overflow-hidden border relative">
              <MapComponent
                position={report.location}
                setPosition={() => {}}
                setAddress={() => {}}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="w-[90%] max-w-[90%] sm:w-[500px] sm:max-w-[500px] mx-auto px-6 rounded-xl fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2">
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the outage report.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </main>
  )
}

