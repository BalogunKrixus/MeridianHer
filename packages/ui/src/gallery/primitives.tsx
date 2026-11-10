"use client"

import {
  BellIcon,
  BookmarkIcon,
  FlagIcon,
  InfoIcon,
  MailIcon,
  PlusIcon,
  SearchIcon,
  SettingsIcon,
  ShieldAlertIcon,
  TriangleAlertIcon,
  UserIcon,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "../components/alert"
import { Badge } from "../components/badge"
import { Button } from "../components/button"
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "../components/card"
import { Checkbox } from "../components/checkbox"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "../components/collapsible"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../components/dropdown-menu"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "../components/field"
import { Input } from "../components/input"
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from "../components/input-group"
import { Kbd } from "../components/kbd"
import { Label } from "../components/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/select"
import { Separator } from "../components/separator"
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "../components/sheet"
import { Spinner } from "../components/spinner"
import { Switch } from "../components/switch"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "../components/table"
import { Textarea } from "../components/textarea"
import { Toggle } from "../components/toggle"
import { ToggleGroup, ToggleGroupItem } from "../components/toggle-group"
import { Tooltip, TooltipContent, TooltipTrigger } from "../components/tooltip"
import { VerifiedTick } from "../patterns/badges"
import { Row, Section, Specimen } from "./layout"

const SPACES = [
  { label: "Periods and cycles", value: "periods" },
  { label: "Menopause", value: "menopause" },
  { label: "Postpartum", value: "postpartum" },
]

export function Primitives() {
  return (
    <Section
      id="primitives"
      title="Primitives"
      description="Your shadcn components (Base UI, base nova) with the brand layer. Only the components the patterns and screens use are in the package."
    >
      <Specimen title="Button" note="Primary plum for one main action per screen." className="flex flex-col gap-4">
        <Row>
          <Button>Ask your question</Button>
          <Button variant="secondary">Follow space</Button>
          <Button variant="outline">Cancel</Button>
          <Button variant="ghost">Skip</Button>
          <Button variant="destructive">Delete post</Button>
          <Button variant="link">Read the guidelines</Button>
        </Row>
        <Row>
          <Button size="xs">Extra small</Button>
          <Button size="sm">Small</Button>
          <Button>Default</Button>
          <Button size="lg">Large</Button>
          <Button size="icon-xs" variant="outline" aria-label="Add">
            <PlusIcon />
          </Button>
          <Button size="icon-sm" variant="outline" aria-label="Add">
            <PlusIcon />
          </Button>
          <Button size="icon" variant="outline" aria-label="Add">
            <PlusIcon />
          </Button>
          <Button size="icon-lg" variant="outline" aria-label="Add">
            <PlusIcon />
          </Button>
        </Row>
        <Row>
          <Button disabled>Disabled</Button>
          <Button disabled>
            <Spinner data-icon="inline-start" /> Posting
          </Button>
          <Button variant="outline">
            <MailIcon data-icon="inline-start" /> With icon
          </Button>
        </Row>
      </Specimen>

      <Specimen title="Badge">
        <Row>
          <Badge>Default</Badge>
          <Badge variant="secondary">Secondary</Badge>
          <Badge variant="soft">Soft</Badge>
          <Badge variant="outline">Outline</Badge>
          <Badge variant="tag">Tag</Badge>
          <Badge variant="expert">Expert</Badge>
          <Badge variant="team">Team</Badge>
          <Badge variant="success">Approved</Badge>
          <Badge variant="warning">Held</Badge>
          <Badge variant="destructive">Banned</Badge>
        </Row>
      </Specimen>

      <div className="grid gap-10 lg:grid-cols-2">
        <Specimen title="Form fields" note="Field family with Zod on the server. Invalid state shown on the last field.">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="g-name">Display name</FieldLabel>
              <Input id="g-name" placeholder="Amber Fern" />
              <FieldDescription>This is how you appear. Never your real name.</FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="g-space">Space</FieldLabel>
              <Select items={SPACES} defaultValue="periods">
                <SelectTrigger id="g-space" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {SPACES.map((s) => (
                    <SelectItem key={s.value} value={s.value}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field>
              <FieldLabel htmlFor="g-search">Search</FieldLabel>
              <InputGroup>
                <InputGroupAddon>
                  <SearchIcon />
                </InputGroupAddon>
                <InputGroupInput id="g-search" placeholder="Search posts, spaces and experts" />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton>Search</InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </Field>
            <Field>
              <FieldLabel htmlFor="g-bio">Short bio</FieldLabel>
              <Textarea id="g-bio" placeholder="Consultant gynaecologist in Lagos" />
            </Field>
            <Field data-invalid>
              <FieldLabel htmlFor="g-year">Year of birth</FieldLabel>
              <Input id="g-year" defaultValue="2013" aria-invalid />
              <FieldError>You need to be 16 or older to join.</FieldError>
            </Field>
          </FieldGroup>
        </Specimen>

        <Specimen
          title="Choice controls"
          note="Checkbox and switch stay small visually but get a 44px hit area on touch."
          className="flex flex-col gap-5"
        >
          <Label>
            <Checkbox defaultChecked /> I accept the community guidelines
          </Label>
          <Label>
            <Checkbox /> Email me a weekly best of my spaces
          </Label>
          <Separator />
          <Label className="justify-between">
            Hide my activity <Switch />
          </Label>
          <Label className="justify-between">
            Expert answer emails <Switch defaultChecked />
          </Label>
          <Separator />
          <Row>
            <Toggle aria-label="Bookmark">
              <BookmarkIcon />
            </Toggle>
            <ToggleGroup variant="outline" spacing={0} defaultValue={["for-you"]} aria-label="Feed sort">
              <ToggleGroupItem value="for-you">For you</ToggleGroupItem>
              <ToggleGroupItem value="new">New</ToggleGroupItem>
              <ToggleGroupItem value="unanswered">Unanswered</ToggleGroupItem>
            </ToggleGroup>
          </Row>
          <ToggleGroup multiple variant="chip" className="flex-wrap" defaultValue={["Period pain"]} aria-label="Tags">
            {["Cravings", "Period pain", "First period"].map((t) => (
              <ToggleGroupItem key={t} value={t}>
                {t}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </Specimen>
      </div>

      <div className="grid gap-10 lg:grid-cols-3">
        <Card>
          <CardHeader>
            <CardTitle>Card: default</CardTitle>
            <CardDescription>Soft shadow, no border.</CardDescription>
            <CardAction>
              <Badge variant="soft">New</Badge>
            </CardAction>
          </CardHeader>
          <CardContent className="text-muted-foreground">Post cards and panels.</CardContent>
          <CardFooter>
            <Button size="sm" variant="secondary">
              Action
            </Button>
          </CardFooter>
        </Card>
        <Card variant="outline">
          <CardHeader>
            <CardTitle>Card: outline</CardTitle>
            <CardDescription>Where a shadow cannot work.</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground">Nested surfaces.</CardContent>
        </Card>
        <Card variant="flat" size="sm">
          <CardHeader>
            <CardTitle>Card: flat, small</CardTitle>
            <CardDescription>Dense admin panels.</CardDescription>
          </CardHeader>
          <CardContent className="text-muted-foreground">Compact padding.</CardContent>
        </Card>
      </div>

      <Specimen title="Alert" className="grid gap-3 md:grid-cols-2">
        <Alert>
          <InfoIcon />
          <AlertTitle>Your post is being checked</AlertTitle>
          <AlertDescription>It will appear shortly. We check new posts to keep everyone safe.</AlertDescription>
        </Alert>
        <Alert variant="warning">
          <TriangleAlertIcon />
          <AlertTitle>You are offline</AlertTitle>
          <AlertDescription>Showing saved posts. New replies will load when you reconnect.</AlertDescription>
        </Alert>
        <Alert variant="success">
          <ShieldAlertIcon />
          <AlertTitle>Report received</AlertTitle>
          <AlertDescription>Thank you. A moderator will review it within 12 hours.</AlertDescription>
        </Alert>
        <Alert variant="destructive">
          <FlagIcon />
          <AlertTitle>This post was removed</AlertTitle>
          <AlertDescription>It broke rule 3: no selling.</AlertDescription>
        </Alert>
        <Alert variant="expert" className="md:col-span-2">
          <VerifiedTick />
          <AlertTitle>You are a verified expert</AlertTitle>
          <AlertDescription>Your answers now carry the expert badge. Renewal due November 2027.</AlertDescription>
        </Alert>
      </Specimen>

      <Specimen title="Overlays and disclosure" note="Open each to check focus, Escape and motion.">
        <Row>
          <Sheet>
            <SheetTrigger render={<Button variant="outline" />}>Sheet</SheetTrigger>
            <SheetContent>
              <SheetHeader>
                <SheetTitle>Filters</SheetTitle>
                <SheetDescription>Narrow the feed by tag.</SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
          <DropdownMenu>
            <DropdownMenuTrigger render={<Button variant="outline" />}>
              <UserIcon data-icon="inline-start" /> Menu
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-52">
              <DropdownMenuGroup>
                <DropdownMenuLabel>Amber Fern</DropdownMenuLabel>
                <DropdownMenuItem>
                  <UserIcon /> Profile
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BookmarkIcon /> Saved
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <SettingsIcon /> Settings
                </DropdownMenuItem>
              </DropdownMenuGroup>
              <DropdownMenuSeparator />
              <DropdownMenuCheckboxItem defaultChecked>Email digest</DropdownMenuCheckboxItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem variant="destructive">Sign out</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Tooltip>
            <TooltipTrigger render={<Button variant="outline" size="icon" aria-label="Notifications" />}>
              <BellIcon />
            </TooltipTrigger>
            <TooltipContent>
              Notifications <Kbd>N</Kbd>
            </TooltipContent>
          </Tooltip>
          <Collapsible>
            <CollapsibleTrigger render={<Button variant="ghost" />}>Show 3 more replies</CollapsibleTrigger>
            <CollapsibleContent className="pt-2 text-muted-foreground">Hidden replies appear here.</CollapsibleContent>
          </Collapsible>
        </Row>
      </Specimen>

      <Specimen title="Table">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Space</TableHead>
              <TableHead className="text-right">Posts this week</TableHead>
              <TableHead className="text-right">Unanswered</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {[
              ["Periods and cycles", 214, 9],
              ["Menopause", 131, 4],
              ["Postpartum", 98, 12],
            ].map(([space, posts, open]) => (
              <TableRow key={space}>
                <TableCell className="font-medium">{space}</TableCell>
                <TableCell className="text-right tabular-nums">{posts}</TableCell>
                <TableCell className="text-right tabular-nums">{open}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Specimen>
    </Section>
  )
}
