import os
p = os.path.expanduser('~') + '/Desktop/CodingVidyaPS/apps/web/src/app/forgot-password/page.tsx'
code = "'use client';import{useState}from'react';import{initializeApp,getApps}from'firebase/app';import{getAuth,sendPasswordResetEmail}from'firebase/auth';var cfg={apiKey:'AIzaSyAAORXxX6tBpfCAtkEvWD_ls_VDhZuMdro',authDomain:'code-vidya-hack-day-ps-3-6b47d.firebaseapp.com',projectId:'code-vidya-hack-day-ps-3-6b47d'};var app=getApps().length?getApps()[0]:initializeApp(cfg);var auth=getAuth(app);"
with open(p, 'w') as f:
    f.write(code)
print('1:', os.path.getsize(p))