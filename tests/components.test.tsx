import { render, screen } from "@testing-library/react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/** 基础组件冒烟（设计系统 §8.1 必测三类之一） */
describe("ui components smoke", () => {
  it("Button renders and applies variant classes", () => {
    render(<Button variant="outline">确定</Button>)
    const btn = screen.getByRole("button", { name: "确定" })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toContain("border")
  })

  it("Button asChild renders child anchor", () => {
    render(
      <Button asChild>
        <a href="/x">跳转</a>
      </Button>
    )
    expect(screen.getByRole("link", { name: "跳转" })).toBeInTheDocument()
  })

  it("Input renders with type", () => {
    render(<Input type="password" aria-label="密码" />)
    expect(screen.getByLabelText("密码")).toHaveAttribute("type", "password")
  })

  it("Badge renders success variant", () => {
    render(<Badge variant="success">注册即用</Badge>)
    expect(screen.getByText("注册即用")).toBeInTheDocument()
  })

  it("Card renders title within card", () => {
    render(
      <Card>
        <CardHeader>
          <CardTitle>最近邮件</CardTitle>
        </CardHeader>
        <CardContent>content</CardContent>
      </Card>
    )
    expect(screen.getByText("最近邮件")).toBeInTheDocument()
  })
})
