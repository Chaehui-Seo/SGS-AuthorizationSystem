//
//  AdminMainPageViewController.swift
//  StoveDevCamp_PersonalProject
//
//  Created by chuiseo-MN on 2021/12/15.
//

import Foundation
import UIKit
import Combine
import SwiftKeychainWrapper

class AdminMainPageViewController: UIViewController {
    
    // MARK: Properties
    @IBOutlet weak var nickNameOutlinedLabel: OutlinedLabel!
    @IBOutlet weak var nickNameFilledLabel: UILabel!
    @IBOutlet weak var tableView: UITableView!
    
    private var cancellable: Set<AnyCancellable> = []
    
    // MARK: Life Cycle
    override func viewDidLoad() {
        super.viewDidLoad()
        self.style()
        self.viewModelBind()
    }
    
    override func viewDidAppear(_ animated: Bool) {
        super.viewWillAppear(animated)
        UserManager.shared.user = nil
        MemoViewModel.shared.user = nil
    }
    
    // MARK: UI Setting
    func style() {
        nickNameOutlinedLabel.outlineColor = UIColor.customDarkGray
        nickNameOutlinedLabel.outlineWidth = 2
    }
    
    // MARK: Data binding with Combine
    func viewModelBind() {
        AdminViewModel.shared.$adminUser.receive(on: RunLoop.main)
            .sink { [weak self] user in
                guard let userInfo = user, let self = self else { return }
                if userInfo.isAdmin == 1 {
                    self.nickNameFilledLabel.text = userInfo.nickName
                    self.nickNameOutlinedLabel.text = userInfo.nickName
                    UsersAPIService.shared.loadUsers { result in
                        DispatchQueue.main.async {
                            if APIResponseAnalyze.analyze(result: result, vc: self) == .success {
                                if let list = result["user"] as? [UserInfo] {
                                    AdminViewModel.shared.users = list
                                }
                            }
                        }
                    }
                }
            }.store(in: &cancellable)
        
        AdminViewModel.shared.$users.receive(on: RunLoop.main)
            .sink { [weak self] users in
                guard let self = self else { return }
                self.tableView.reloadData()
            }.store(in: &cancellable)
    }
    
    // MARK: Button Action
    @IBAction func settingButtonDidTap(_ sender: Any) {
        UserManager.shared.user = AdminViewModel.shared.adminUser
        guard let settingPage = UIStoryboard(name: "Setting", bundle: nil).instantiateViewController(withIdentifier: "SettingViewController") as? SettingViewController else { return }
        self.navigationController?.pushViewController(settingPage, animated: true)
    }
}

// MARK: UITableView
extension AdminMainPageViewController: UITableViewDataSource, UITableViewDelegate {
    func tableView(_ tableView: UITableView, numberOfRowsInSection section: Int) -> Int {
        guard let users = AdminViewModel.shared.users else { return 0 }
        return users.count
    }
    
    func tableView(_ tableView: UITableView, cellForRowAt indexPath: IndexPath) -> UITableViewCell {
        guard let cell = tableView.dequeueReusableCell(withIdentifier: "AdminListCell", for: indexPath) as? AdminListCell else { return UITableViewCell() }
        guard let users = AdminViewModel.shared.users else { return cell }
        cell.updateUI(no: indexPath.row + 1, userInfo: users[indexPath.row])
        if indexPath.row % 2 == 0 {
            cell.backgroundColor = UIColor.systemGray6
        } else {
            cell.backgroundColor = UIColor.white
        }
        return cell
    }
    
    // ?????? ??????
    func tableView(_ tableView: UITableView, didSelectRowAt indexPath: IndexPath) {
        guard let users = AdminViewModel.shared.users, let userInfo = AdminViewModel.shared.adminUser else { return }
        let alert = UIAlertController(title: users[indexPath.row].userId, message: nil, preferredStyle: .actionSheet)
        
        let action1 = UIAlertAction(title: "????????? ????????????", style: .default) { _ in
            UserManager.shared.user = users[indexPath.row]
            guard let nicknamePage = UIStoryboard(name: "Account", bundle: nil).instantiateViewController(withIdentifier: "NicknameChangeViewController") as? NicknameChangeViewController else { return }
            self.navigationController?.pushViewController(nicknamePage, animated: true)
        }
        
        let action2 = UIAlertAction(title: "???????????? ????????????", style: .default) { _ in
            guard let pwPage = UIStoryboard(name: "Account", bundle: nil).instantiateViewController(withIdentifier: "PwChangeViewController") as? PwChangeViewController else { return }
            pwPage.idInfo = users[indexPath.item].userId
            self.navigationController?.pushViewController(pwPage, animated: true)
        }
        
        let action3 = UIAlertAction(title: users[indexPath.row].isBlocked == 0 ? "????????????" : "?????? ????????????", style: .default) { _ in
            if users[indexPath.row].isAdmin == 1 {
                let alert = UIAlertController(title: "", message: "????????? ????????? ???????????? ??? ????????????", preferredStyle: .alert)
                let action1 = UIAlertAction(title: "??????", style: .cancel, handler: nil)
                alert.addAction(action1)
                self.present(alert, animated: true, completion: nil)
                return
            }
            let alert = UIAlertController(title: "", message: users[indexPath.row].isBlocked == 0 ? "\(users[indexPath.row].userId) ????????? ?????????????????????????" : "\(users[indexPath.row].userId) ????????? ????????? ?????????????????????????", preferredStyle: .alert)
            let action1 = UIAlertAction(title: "??????", style: .cancel, handler: nil)
            let action2 = UIAlertAction(title: users[indexPath.row].isBlocked == 0 ? "??????" : "????????????", style: .destructive) { _ in
                if users[indexPath.row].isBlocked == 0 {
                    // ??????
                    UsersAPIService.shared.changeUserBlock(jwt: KeychainWrapper.standard[.accessToken], userId: users[indexPath.row].userId, isBlocked: 1, isAdmin: userInfo.isAdmin) { result in
                        DispatchQueue.main.async {
                            switch APIResponseAnalyze.analyze_withToken(result: result, vc: self) {
                            case .success :
                                if let list = result["user"] as? [UserInfo] {
                                    AdminViewModel.shared.users = list
                                    let alert = UIAlertController(title: "????????????", message: "???????????? ????????? ?????? ????????? ??????????????????", preferredStyle: .alert)
                                    alert.addTextField { (textField : UITextField!) -> Void in
                                        textField.addTarget(alert, action: #selector(alert.textDidChange), for: .editingChanged)
                                    }
                                    alert.textFields?[0].text = "??????????????????"
                                    let action1 = UIAlertAction(title: "??????", style: .default, handler: {_ in
                                        BlockMessageAPIService.shared.createBlockMessage(fromUser: userInfo.userId, toUser: users[indexPath.row].userId, content: alert.textFields?[0].text ?? "??????????????????") { _ in
                                            // ?????? ????????? ??????
                                        }
                                    })
                                    alert.addAction(action1)
                                    self.present(alert, animated: true, completion: nil)
                                }
                            case .InvalidToken :
                                UsersAPIService.shared.checkRefreshToken() { result2 in
                                    DispatchQueue.main.async {
                                        switch APIResponseAnalyze.analyze_withToken(result: result2, vc: self) {
                                        case .success :
                                            UsersAPIService.shared.changeUserBlock(jwt: KeychainWrapper.standard[.accessToken], userId: users[indexPath.row].userId, isBlocked: 1, isAdmin: userInfo.isAdmin) { result3 in
                                                DispatchQueue.main.async {
                                                    switch APIResponseAnalyze.analyze_withToken(result: result3, vc: self) {
                                                    case .success :
                                                        if let list = result3["user"] as? [UserInfo] {
                                                            AdminViewModel.shared.users = list
                                                            let alert = UIAlertController(title: "????????????", message: "???????????? ????????? ?????? ????????? ??????????????????", preferredStyle: .alert)
                                                            alert.addTextField { (textField : UITextField!) -> Void in
                                                                textField.addTarget(alert, action: #selector(alert.textDidChange), for: .editingChanged)
                                                            }
                                                            alert.textFields?[0].text = "??????????????????"
                                                            let action1 = UIAlertAction(title: "??????", style: .default, handler: {_ in
                                                                BlockMessageAPIService.shared.createBlockMessage(fromUser: userInfo.userId, toUser: users[indexPath.row].userId, content: alert.textFields?[0].text ?? "??????????????????") { _ in
                                                                    // ?????? ????????? ??????
                                                                }
                                                            })
                                                            alert.addAction(action1)
                                                            self.present(alert, animated: true, completion: nil)
                                                        }
                                                    case .InvalidToken :
                                                        self.invalidToken()
                                                    case .fail:
                                                        self.errorOccur()
                                                    }
                                                }
                                            }
                                        case .InvalidToken :
                                            self.invalidToken()
                                        case .fail:
                                            self.errorOccur()
                                        }
                                    }
                                }
                            case .fail :
                                self.errorOccur()
                            }
                        }
                    }
                } else {
                    // ??????
                    UsersAPIService.shared.changeUserBlock(jwt: KeychainWrapper.standard[.accessToken], userId: users[indexPath.row].userId, isBlocked: 0, isAdmin: userInfo.isAdmin) { result in
                        DispatchQueue.main.async {
                            switch APIResponseAnalyze.analyze_withToken(result: result, vc: self) {
                            case .success :
                                if let list = result["user"] as? [UserInfo] {
                                    AdminViewModel.shared.users = list
                                    BlockMessageAPIService.shared.deleteBlockMessage(toUser: users[indexPath.row].userId) { _ in
                                    }
                                }
                            case .InvalidToken :
                                UsersAPIService.shared.checkRefreshToken() { result2 in
                                    DispatchQueue.main.async {
                                        switch APIResponseAnalyze.analyze_withToken(result: result2, vc: self) {
                                        case .success :
                                            UsersAPIService.shared.changeUserBlock(jwt: KeychainWrapper.standard[.accessToken], userId: users[indexPath.row].userId, isBlocked: 0, isAdmin: userInfo.isAdmin) { result3 in
                                                DispatchQueue.main.async {
                                                    switch APIResponseAnalyze.analyze_withToken(result: result3, vc: self) {
                                                    case .success :
                                                        if let list = result3["user"] as? [UserInfo] {
                                                            AdminViewModel.shared.users = list
                                                            BlockMessageAPIService.shared.deleteBlockMessage(toUser: users[indexPath.row].userId) { _ in
                                                            }
                                                        }
                                                    case .InvalidToken :
                                                        self.invalidToken()
                                                    case .fail:
                                                        self.errorOccur()
                                                    }
                                                }
                                            }
                                        case .InvalidToken :
                                            self.invalidToken()
                                        case .fail:
                                            self.errorOccur()
                                        }
                                    }
                                }
                            case .fail :
                                self.errorOccur()
                            }
                        }
                    }
                }
            }
            alert.addAction(action1)
            alert.addAction(action2)
            self.present(alert, animated: true, completion: nil)
        }
        let action4 = UIAlertAction(title: "?????? ????????????", style: .default) { _ in
            MemoViewModel.shared.user = users[indexPath.row]
            UserManager.shared.user = userInfo
            guard let memoPage = UIStoryboard(name: "Admin", bundle: nil)
                .instantiateViewController(withIdentifier: "AdminMemoViewController") as? AdminMemoViewController else { return }
            self.navigationController?.pushViewController(memoPage, animated: true)
        }
        let action5 = UIAlertAction(title: "?????? ????????????", style: .destructive) { _ in
            if users[indexPath.row].isAdmin == 1 {
                let alert = UIAlertController(title: "", message: "????????? ????????? ???????????? ??? ????????????", preferredStyle: .alert)
                let action1 = UIAlertAction(title: "??????", style: .cancel, handler: nil)
                alert.addAction(action1)
                self.present(alert, animated: true, completion: nil)
                return
            }
            let alert = UIAlertController(title: "", message: "????????? ????????? ????????? ??? ????????????. ????????? ????????? ?????????????????????????", preferredStyle: .alert)
            let action1 = UIAlertAction(title: "??????", style: .cancel, handler: nil)
            let action2 = UIAlertAction(title: "??????", style: .destructive) { _ in
                UsersAPIService.shared.withdrawal(jwt: KeychainWrapper.standard[.accessToken], userId: users[indexPath.row].userId, password: "", isAdmin: userInfo.isAdmin) { result in
                    DispatchQueue.main.async {
                        switch APIResponseAnalyze.analyze_withToken(result: result, vc: self) {
                        case .success :
                            UsersAPIService.shared.loadUsers { result in
                                DispatchQueue.main.async {
                                    if APIResponseAnalyze.analyze_withToken(result: result, vc: self) == .success {
                                        if let list = result["user"] as? [UserInfo] {
                                            AdminViewModel.shared.users = list
                                            let alert = UIAlertController(title: "", message: "?????????????????????", preferredStyle: .alert)
                                            let action1 = UIAlertAction(title: "??????", style: .cancel, handler: nil)
                                            alert.addAction(action1)
                                            self.present(alert, animated: true, completion: nil)
                                        }
                                    }
                                }
                            }
                        case .InvalidToken :
                            UsersAPIService.shared.checkRefreshToken() { result2 in
                                DispatchQueue.main.async {
                                    switch APIResponseAnalyze.analyze_withToken(result: result2, vc: self) {
                                    case .success :
                                        UsersAPIService.shared.withdrawal(jwt: KeychainWrapper.standard[.accessToken], userId: users[indexPath.row].userId, password: "", isAdmin: userInfo.isAdmin) { result3 in
                                            DispatchQueue.main.async {
                                                switch APIResponseAnalyze.analyze_withToken(result: result3, vc: self) {
                                                case .success :
                                                    UsersAPIService.shared.loadUsers { result in
                                                        DispatchQueue.main.async {
                                                            if APIResponseAnalyze.analyze_withToken(result: result, vc: self) == .success {
                                                                if let list = result3["user"] as? [UserInfo] {
                                                                    AdminViewModel.shared.users = list
                                                                    let alert = UIAlertController(title: "", message: "?????????????????????", preferredStyle: .alert)
                                                                    let action1 = UIAlertAction(title: "??????", style: .cancel, handler: nil)
                                                                    alert.addAction(action1)
                                                                    self.present(alert, animated: true, completion: nil)
                                                                }
                                                            }
                                                        }
                                                    }
                                                case .InvalidToken :
                                                    self.invalidToken()
                                                case .fail:
                                                    self.errorOccur()
                                                }
                                            }
                                        }
                                    case .InvalidToken :
                                        self.invalidToken()
                                    case .fail:
                                        self.errorOccur()
                                    }
                                }
                            }
                        case .fail :
                            self.errorOccur()
                        }
                    }
                }
            }
            alert.addAction(action1)
            alert.addAction(action2)
            self.present(alert, animated: true, completion: nil)
        }
        let action6 = UIAlertAction(title: "??????", style: .cancel, handler: nil)
        alert.addAction(action1)
        alert.addAction(action2)
        alert.addAction(action3)
        alert.addAction(action4)
        alert.addAction(action5)
        alert.addAction(action6)
        self.present(alert, animated: true, completion: nil)
    }
    
    func tableView(_ tableView: UITableView, heightForRowAt indexPath: IndexPath) -> CGFloat {
        return 50
    }
}
