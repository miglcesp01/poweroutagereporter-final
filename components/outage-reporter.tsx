"use client"
import { useState, useEffect } from "react"
import { usePathname } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { AlertTriangle, Zap, BatteryLow } from "lucide-react"
import dynamic from "next/dynamic"
import { useForm } from "react-hook-form"
import { FormField, FormItem, FormLabel, FormControl, FormMessage, Form } from "@/components/ui/form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "sonner"

const MapComponent = dynamic(() => import("@/components/map-component"), {
  ssr: false,
  loading: () => (
    <div className="h-[250px] w-full flex items-center justify-center bg-gray-100 rounded-md">Loading map...</div>
  ),
})

export type OutageReport = {
  id: string
  location: {
    lat: number
    lng: number
  }
  address: string
  severity: "critical" | "major" | "minor"
  description: string
  timestamp: number
  status: "reported" | "investigating" | "resolved"
}

const formSchema = z.object({
  address: z.string().min(1, { message: "Address is required" }),
  severity: z.enum(["critical", "major", "minor"], {
    required_error: "Please select a severity level",
  }),
  description: z.string().min(1, { message: "Description is required" }),
})

interface OutageReporterProps {
  reports: OutageReport[]
  setReports: (reports: OutageReport[]) => void
}

export default function OutageReporter({ reports, setReports }: OutageReporterProps) {
  const [position, setPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [isFetchingLocation, setIsFetchingLocation] = useState(true)
  const pathname = usePathname()

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      address: "",
      severity: "major",
      description: "",
    },
  })

  const fetchUserLocation = () => {
    setIsFetchingLocation(true)

    if (typeof window !== "undefined" && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
          setIsFetchingLocation(false)
        },
        (error) => {
          console.log("Geolocation error:", error.message)
          setPosition({ lat: 40.7128, lng: -74.006 })
          setIsFetchingLocation(false)
        },
        { timeout: 10000, maximumAge: 0 },
      )
    } else {
      setPosition({ lat: 40.7128, lng: -74.006 })
      setIsFetchingLocation(false)
    }
  }

  useEffect(() => {
    fetchUserLocation()
  }, [])

  useEffect(() => {
    if (pathname === "/") {
      fetchUserLocation()
    }
  }, [pathname])

  const setAddress = (address: string) => {
    form.setValue("address", address)
  }

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    if (!position) {
      toast.error("Please select a location on the map")
      return
    }

    const newReport: OutageReport = {
      id: Date.now().toString(),
      location: position,
      address: values.address,
      severity: values.severity,
      description: values.description,
      timestamp: Date.now(),
      status: "reported",
    }

    setReports([newReport, ...reports])
    toast.success("Report submitted")

    form.reset({
      address: values.address,
      severity: "major",
      description: "",
    })
  }

  return (
    <div className="space-y-4 h-full">
      <Card className="overflow-hidden">
        <CardHeader className="p-4 pb-2">
          <CardDescription>Click on the map to pinpoint your location, then fill out the form below.</CardDescription>
        </CardHeader>
        <CardContent className="p-4 pt-2 space-y-4">
          <div className="h-[250px] w-full rounded-md overflow-hidden border relative">
            {isFetchingLocation ? (
              <div className="h-full w-full flex items-center justify-center bg-gray-100 rounded-md">
                Fetching your location...
              </div>
            ) : (
              <MapComponent position={position} setPosition={setPosition} setAddress={setAddress} />
            )}
          </div>

          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-3">
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
                            <RadioGroupItem value="critical" id="critical" />
                          </FormControl>
                          <FormLabel htmlFor="critical" className="flex items-center gap-1 font-normal cursor-pointer">
                            <AlertTriangle className="h-4 w-4 text-red-500" />
                            Critical (No power, safety concern)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="major" id="major" />
                          </FormControl>
                          <FormLabel htmlFor="major" className="flex items-center gap-1 font-normal cursor-pointer">
                            <Zap className="h-4 w-4 text-amber-500" />
                            Major (Complete outage)
                          </FormLabel>
                        </FormItem>
                        <FormItem className="flex items-center space-x-2 space-y-0">
                          <FormControl>
                            <RadioGroupItem value="minor" id="minor" />
                          </FormControl>
                          <FormLabel htmlFor="minor" className="flex items-center gap-1 font-normal cursor-pointer">
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

              <Button type="submit" className="w-full md:w-auto">
                Submit Report
              </Button>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  )
}

