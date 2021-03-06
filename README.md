# Authorization System
![Swift](https://img.shields.io/badge/swift-v5.5.2-orange?logo=swift) ![Xcode](https://img.shields.io/badge/xcode-v13.1-blue?logo=xcode) ![nodejs](https://img.shields.io/badge/node.js-v16.13.1-green?logo=node.js) ![mySQL](https://img.shields.io/badge/mySQL-v8.0.23-black?logo=mysql&logoColor=white)
</br>

## π¬ About Project
Node.jsλ‘ μλ²λ₯Ό κ΅¬μΆνκ³  Amazon RDSλ‘ MySQLμ μ΄μνκ³  μλ iOS μ±μλλ€.<br/>
μΈμ¦ μμ€νμ μ£Όμνκ² λ€λ£¨λ, μ±λ¨μμ λ³΄μ¬μ€ μ μλ μμλ€μ μμ λ‘­κ° μΆκ°νμμ΅λλ€.
<br/>
<br/>

## π± ScreenShots
<Blockquote>
μ€μ  μ± κ΅¬λνλ©΄μλλ€
</Blockquote>

| ![register](./image/register.gif) | ![generalLogin](./image/userLogin.gif) | ![adminLogin](./image/admin.gif) | ![autoLogin](./image/autoLogin.gif) |
| :-: | :-: | :-: | :-: |
| νμκ°μ νμ΄μ§ | μΌλ°μ μ  λ‘κ·ΈμΈ | κ΄λ¦¬μ λ‘κ·ΈμΈ | μλ λ‘κ·ΈμΈ |
| ![blockedLogin](./image/blockedUser.gif) | ![personalMemo](./image/addMemo.gif) | ![accountEditing](./image/editAccount.gif) | ![gesture](./image/tapGesture.gif) |
| μ°¨λ¨μ μ  λ‘κ·ΈμΈ  | κ°μΈ λ©λͺ¨ μμ± | κ°μΈμ λ³΄ μμ  | ν­μ μ€μ² μΈμ |
<br/>

## πββοΈ Installation
> νμ€νΈ runμ μν΄μ ν΄λΉ μ λ³΄κ° νμνμ  κ²½μ° λ§μν΄μ£Όμλ©΄ μ κ³΅ν΄λλ¦¬κ² μ΅λλ€.
1. Server ν΄λμ μλ μ¬ν­λ€μ ν¬ν¨ν `.env` νμΌμ μΆκ°ν΄μ£ΌμΈμ.
```
PORT=3306
dbHost='database-1.clcnthr2is4n.ap-northeast-2.rds.amazonaws.com'
dbUser='admin'
dbPassword='admin123'
dbName='PersonalProject'
emailId='sgssgmanager@gmail.com'
emailPw='streamingsgs!'
jwtSecret='Kn8tO1Q4zPpw9vFUsatjPKb8mGuo8H/uM/9nGOMmKQjXG+ZGbK1Tuk/FuLULr+WJ6VeAAXI3GruLi6S+'
```
2. Server ν΄λλ‘ μ΄λνμ  ν νμν λͺ¨λμ μ€μΉν΄μ£ΌμΈμ. νμν λͺ¨λμ ν¬ν¨ν μ½λλ μλμ κ°μ΅λλ€.
```
npm install mysql express env-cmd bcryptjs jsonwebtoken nodemon dotenv --save
```
3. `npm start`λ₯Ό μ€ννμλ©΄ μλ²λ₯Ό μμνμ€ μ μμ΅λλ€
4. iOS ν΄λλ‘ μ΄λνμμ `StoveDevCamp_PersonalProject.xcodeproj` νμΌμ μ΄μ΄μ£Όμκ³ , μλ?¬λ μ΄ν°λ₯Ό μ ννμ  ν run(`command + r`)νμλ©΄ μ±μ μ¬μ©νμ€ μ μμ΅λλ€
```
<νμ€νΈ κ³μ  μ λ³΄>
1) μΌλ° μ μ 
  id: test@gmail.com
  pw: aaa123
2) μ°¨λ¨λ μ μ 
  id: block@gmail.com
  pw: aaa123
3) μ΄λλ―Ό μ μ 
  id: admin
  pw: admin
```
<br/>

## π Features
###  1) μ΄λ©μΌ μΈμ¦μ ν΅ν νμκ°μ
- SMTPλ₯Ό μ¬μ©νμ¬ μ΄λ©μΌ μΈμ¦ κ΅¬ν

###  2) λ³΄λ€ μμ ν ν ν° κΈ°λ° μΈμ¦
- Refresh Tokenκ³Ό AccessTokenλ₯Ό λλ€ μ΄μ©νμ¬μ λ³΄μ κ°ν

###  3) μλλ‘κ·ΈμΈ
- SwiftKeychainWrapperμ UserDefaultsλ₯Ό μ¬μ©ν΄μ μλλ‘κ·ΈμΈ κ΅¬ν

###  4) μ λλ©μ΄μ μμ
- Lottieμ CGAffineTransformλ₯Ό μ΄μ©νμ¬μ λνμΌν μ λλ©μ΄μ μΆκ°

###  5) User Interactive μμ κ°λ―Έ
- μ μ μ long pressμ tap λμμ μνΈμμ©μ μΌλ‘ λ°μνλ UX μμ μΆκ°
<br/>

## π  Architecture
### 1) μ μ²΄ μν€νμ²
> λͺ¨λλ¦¬μ μν€νμ²λ₯Ό μ¬μ©νμμ΅λλ€.

![Architecture](./image/architecture.png)

### 2) iOS κ΅¬μ‘°
> MVVM ν¨ν΄μ μ±ννμμ΅λλ€. νλ©΄ κ° μ°κ²°μ μλμ κ°μ΄ κ΅¬μ±λμμ΅λλ€.

![iOS_Structure](./image/iOS_Structure.png)
<br/>

## π₯ Technical Achievements
### μλ² μ¬μ΄λ
- μ§μ  RDBMSλ₯Ό μ€κ³νκ³ , SQL μΏΌλ¦¬λ¬Έμ μμ±νμμ΅λλ€.
- node.jsλ‘ μλ²λ₯Ό κ΅¬μΆνκ³  restAPIλ₯Ό μ€κ³ λ° κ΅¬ννμμ΅λλ€.
- ν ν°μ μ΄μ©ν μΈμ¦ μ μ°¨λ₯Ό μ΄ν΄νκ³ , access tokenκ³Ό refresh tokenμ λμνμμ΅λλ€. access tokenμ 2μκ°, refresh tokenμ 14μΌ ν λ§λ£λλλ‘ μ€μ νμμ΅λλ€.
- SMTPλ₯Ό μ¬μ©νμ¬μ μ΄λ©μΌ μΈμ¦μ κ΅¬ννμμ΅λλ€.

### iOS μ¬μ΄λ
- refresh tokenκ³Ό access tokenμ κ΄λ¦¬νκ³ , μλ²μ ν΅μ νλ©° μ μ ν μ‘μμ μ·¨νλλ‘ κ΅¬ννμμ΅λλ€.
- μ¬λ¬ κ³μΈ΅μ κ±°μΉ λ°μ΄ν° μ λ¬κ³Ό λΉλκΈ° μ΄λ²€νΈ νΈλ€λ§μ μν΄μ Combineμ μ κ·Ή μ¬μ©νμμ΅λλ€.
- SwiftKeychainWrapperμ UserDefaults, tokenμ μ μ ν νμ©νμ¬ μμ νκ² μλλ‘κ·ΈμΈμ κ΅¬ννμμ΅λλ€.
- νμκ°μμ μ§ννλ μ€ μμμΉ λͺ»νκ² μ’λ£μ λμν  μ μλλ‘ UserDefaultsλ₯Ό μ΄μ©νμμ΅λλ€.
- Lottieμ CGAffineTransformλ₯Ό μ΄μ©νμ¬μ μ λλ©μ΄μμ μΈ μμλ₯Ό μΆκ°νμ¬ μ±μ μμ±λλ₯Ό λμμ΅λλ€.
- μ μ μ μ μ€μ²μ λ°μνμ¬μ μ λλ©μ΄μμ μμΉκ° λ°λκ±°λ, long pressλ‘ λ°μ μ΄λͺ¨μ§λ₯Ό λ³΄λ΄λ λ± interactiveν μ¬λ―Έ μμλ€μ μΆκ°νμμ΅λλ€.
