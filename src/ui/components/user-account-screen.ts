/**
 * User Account Screen
 * 
 * Handles user login, account creation, and profile selection
 */

import { userManager, AVATARS, User, Avatar } from '../../data/user-manager';

export class UserAccountScreen {
  private container: HTMLElement;
  private onLoginCallback?: (user: User) => void;

  constructor(container: HTMLElement) {
    this.container = container;
  }

  /**
   * Set callback for successful login
   */
  setOnLogin(callback: (user: User) => void): void {
    this.onLoginCallback = callback;
  }

  /**
   * Render the account screen
   */
  async render(): Promise<void> {
    this.container.innerHTML = '';
    
    const wrapper = document.createElement('div');
    wrapper.className = 'account-screen';

    // Check if user is already logged in
    const currentUser = await userManager.loadCurrentUser();
    if (currentUser) {
      this.renderWelcomeBack(wrapper, currentUser);
    } else {
      await this.renderLoginScreen(wrapper);
    }

    this.container.appendChild(wrapper);
  }

  /**
   * Render welcome back screen for existing user
   */
  private renderWelcomeBack(wrapper: HTMLElement, user: User): void {
    wrapper.innerHTML = `
      <div class="welcome-back card">
        <h1>Welcome Back! 👋</h1>
        <div class="user-profile">
          <div class="user-avatar-large">${user.avatar}</div>
          <h2>${user.username}</h2>
        </div>
        <button class="button-primary continue-button">Continue as ${user.username}</button>
        <button class="button-secondary switch-user-button">Switch User</button>
      </div>
    `;

    const continueBtn = wrapper.querySelector('.continue-button') as HTMLButtonElement;
    const switchBtn = wrapper.querySelector('.switch-user-button') as HTMLButtonElement;

    continueBtn.onclick = () => {
      if (this.onLoginCallback) {
        this.onLoginCallback(user);
      }
    };

    switchBtn.onclick = () => {
      userManager.logout();
      this.render();
    };
  }

  /**
   * Render login/create account screen
   */
  private async renderLoginScreen(wrapper: HTMLElement): Promise<void> {
    const users = await userManager.getAllUsers();

    wrapper.innerHTML = `
      <div class="login-screen card">
        <h1>♟️ Chess Learning</h1>
        <p class="subtitle">Offline Chess Game for Kids</p>

        ${users.length > 0 ? `
          <div class="existing-users">
            <h2>Select Your Profile</h2>
            <div class="user-list"></div>
            <div class="divider">or</div>
          </div>
        ` : ''}

        <div class="create-account">
          <h2>Create New ${users.length > 0 ? 'Profile' : 'Account'}</h2>
          
          <div class="form-group">
            <label>Choose Your Avatar</label>
            <div class="avatar-selector"></div>
            <input type="hidden" id="selected-avatar" value="${AVATARS[0]}">
          </div>

          <div class="form-group">
            <label>Username (2-20 characters)</label>
            <input 
              type="text" 
              id="username-input" 
              placeholder="Enter your name"
              maxlength="20"
              autocomplete="off"
            >
            <div class="error-message"></div>
          </div>

          <button class="button-primary create-account-button">
            ${users.length > 0 ? 'Create Profile' : 'Start Playing'}
          </button>
        </div>

        ${users.length === 0 ? `
          <div class="guest-mode">
            <p>Just want to try it out?</p>
            <button class="button-secondary guest-button">Play as Guest</button>
          </div>
        ` : ''}
      </div>
    `;

    // Render existing users if any
    if (users.length > 0) {
      const userList = wrapper.querySelector('.user-list') as HTMLElement;
      this.renderUserList(userList, users);
    }

    // Render avatar selector
    const avatarSelector = wrapper.querySelector('.avatar-selector') as HTMLElement;
    this.renderAvatarSelector(avatarSelector);

    // Setup form handlers
    this.setupFormHandlers(wrapper);
  }

  /**
   * Render list of existing users
   */
  private renderUserList(container: HTMLElement, users: User[]): void {
    users.forEach(user => {
      const userCard = document.createElement('div');
      userCard.className = 'user-card';
      userCard.innerHTML = `
        <div class="user-avatar">${user.avatar}</div>
        <div class="user-name">${user.username}</div>
      `;

      userCard.onclick = async () => {
        await userManager.login(user.id);
        if (this.onLoginCallback) {
          this.onLoginCallback(user);
        }
      };

      container.appendChild(userCard);
    });
  }

  /**
   * Render avatar selector
   */
  private renderAvatarSelector(container: HTMLElement): void {
    AVATARS.forEach((avatar, index) => {
      const avatarBtn = document.createElement('button');
      avatarBtn.className = `avatar-option ${index === 0 ? 'selected' : ''}`;
      avatarBtn.textContent = avatar;
      avatarBtn.type = 'button';

      avatarBtn.onclick = () => {
        // Remove selected class from all
        container.querySelectorAll('.avatar-option').forEach(btn => {
          btn.classList.remove('selected');
        });
        
        // Add to clicked
        avatarBtn.classList.add('selected');
        
        // Update hidden input
        const hiddenInput = container.closest('.create-account')?.querySelector('#selected-avatar') as HTMLInputElement;
        if (hiddenInput) {
          hiddenInput.value = avatar;
        }
      };

      container.appendChild(avatarBtn);
    });
  }

  /**
   * Setup form event handlers
   */
  private setupFormHandlers(wrapper: HTMLElement): void {
    const usernameInput = wrapper.querySelector('#username-input') as HTMLInputElement;
    const createBtn = wrapper.querySelector('.create-account-button') as HTMLButtonElement;
    const errorMsg = wrapper.querySelector('.error-message') as HTMLElement;
    const guestBtn = wrapper.querySelector('.guest-button') as HTMLButtonElement;

    // Create account
    createBtn.onclick = async () => {
      const username = usernameInput.value.trim();
      const avatar = (wrapper.querySelector('#selected-avatar') as HTMLInputElement).value as Avatar;

      try {
        errorMsg.textContent = '';
        errorMsg.classList.remove('visible');

        const user = await userManager.createUser(username, avatar);
        await userManager.login(user.id);

        if (this.onLoginCallback) {
          this.onLoginCallback(user);
        }
      } catch (error) {
        errorMsg.textContent = (error as Error).message;
        errorMsg.classList.add('visible');
      }
    };

    // Allow Enter key to submit
    usernameInput.onkeypress = (e) => {
      if (e.key === 'Enter') {
        createBtn.click();
      }
    };

    // Guest mode (if button exists)
    if (guestBtn) {
      guestBtn.onclick = async () => {
        const user = await userManager.createUser('Guest', AVATARS[0]);
        await userManager.login(user.id);

        if (this.onLoginCallback) {
          this.onLoginCallback(user);
        }
      };
    }
  }
}
