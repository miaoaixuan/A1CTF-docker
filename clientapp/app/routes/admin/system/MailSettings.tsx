import React, { useState, useEffect } from "react";
import axios from "axios";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "components/ui/card";
import { Button } from "components/ui/button";
import { Input } from "components/ui/input";
import { Label } from "components/ui/label";
import { Textarea } from "components/ui/textarea";
import { Switch } from "components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "components/ui/select";
import { Atom, Bird, Cat, Image, Loader2, Mail, Siren, Upload, UserLock } from "lucide-react";
import { toast } from "sonner";
import { MacScrollbar } from "mac-scrollbar";
import { useForm, UseFormReturn } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "components/ui/form";
import { useLocation, useSearchParams } from "react-router";
import { AdminHeader } from "components/admin/AdminHeader";
import AboutPage from "components/admin/AboutPage";
import { SystemSettingsValues } from "./AdminSettingsPage";


export const MailSettings = (
    { form } : {
        form: UseFormReturn<SystemSettingsValues>,
    }
) => {

    return (
        <>
            <span className="text-2xl font-bold">邮件设置</span>
            <FormField
                control={form.control}
                name="smtpEnabled"
                render={({ field }) => (
                    <FormItem className="flex items-center justify-between py-2">
                        <div>
                            <FormLabel>启用SMTP</FormLabel>
                            <FormDescription>是否启用系统邮件发送功能</FormDescription>
                        </div>
                        <FormControl>
                            <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                            />
                        </FormControl>
                    </FormItem>
                )}
            />

            <div className="grid gap-4">
                <FormField
                    control={form.control}
                    name="smtpHost"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>SMTP服务器</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="例如: smtp.example.com" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="smtpPort"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>SMTP端口</FormLabel>
                            <FormControl>
                                <Input
                                    type="number"
                                    placeholder="例如: 587"
                                    value={field.value}
                                    onChange={(e) => field.onChange(parseInt(e.target.value) || 587)}
                                />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="smtpUsername"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>SMTP用户名</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="邮箱账号" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="smtpPassword"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>SMTP密码</FormLabel>
                            <FormControl>
                                <Input {...field} type="password" placeholder="邮箱密码或授权码" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="smtpFrom"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>发件人地址</FormLabel>
                            <FormControl>
                                <Input {...field} placeholder="例如: noreply@example.com" />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </div>

            <div className="pt-4">
                <Button type="button" variant="outline">测试邮件配置</Button>
            </div>
        </>
    );
};

export default MailSettings; 